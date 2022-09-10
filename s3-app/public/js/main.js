$(document).ready(function() {
  loadFiles();
});

function elem(id) {
  return document.getElementById(id);
}

async function loadFiles() {
  try {
    const response = await fetch('/file-operations/files');
    const files = await response.json();
    if (!Array.isArray(files)) {
      return;
    }
    $('#tbody').empty();
    files.forEach(file => {
      $('#tbody').append(`
        <tr> 
          <td class="file-name" onclick="displayFile('${file.key}')">${file.key}</td>
          <td>${file.size}</td>
          <td>${file.lastModified}</td>
        </tr>
      `);
    }); 
  } catch(err) {
    console.error(err);
  }
}

function checkForFile(event) {
  const files = event.target.files;
  if (files.length ) {
    $('#alert').hide();
  }
}

async function displayFile(fileKey) {
  try {
    const res = await fetch(`/file-operations/signed-url?key=${fileKey}`);
    const { signedUrl } = await res.json();
    $('#frame').attr('src', signedUrl)
  } catch(err) {
    console.error(err);
  }
}

async function uploadToS3(fileId) {
  $('#alert').hide();
  const fileInput1 = elem('file1');
  const fileInput2 = elem('file2');
  const fileInput3 = elem('file3');
  const fileInputs = [fileInput1, fileInput2, fileInput3];
  const nofileSelected = fileInputs.every(fileInput => fileInput.files.length == 0)
  if (nofileSelected) {
    $('#alert').text('No file selected').addClass('alert-danger').show();
    return;
  }
  const filesData = [];
  fileInputs.forEach(fileInput => {
    const files = fileInput.files;
    if (!files.length) {
      return;
    }
    const file = fileInput.files[0];
    const {type, name, size} = file;
    filesData.push({type, name, size, file})
  });

  const data = filesData.map(fl => ({type: fl.type, name: fl.name, size: fl.size}));
  const filesDataResult =  await getPresignedUrl({files: data});
  if (!Array.isArray(filesDataResult)) {
    return;
  }
  let n = 0;
  try {
    for(let item of filesData) {
      const fileData = filesDataResult.find(result => result.key == item.key);
      if (fileData) {
        await sendToS3(fileData.signedUrl, item.file);
        n++;
      }
    }
    $('#alert').text(`Uploaded ${n} file(s)`).addClass('alert-success').show();
    loadFiles();
  } catch(err) {
    console.error(err);
  }
}

async function getPresignedUrl(data) {
  try { 
    const res = await fetch('/file-operations/presign-url', { 
      method: 'POST', 
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      }
    });
    const result = await res.json();
    return result;
  } catch(err) {
    console.error(err);
  }
}

async function sendToS3(presignedUrl, file) {
  const res = await fetch(presignedUrl, {method: 'PUT', body: file});
  if (res.statusText != 'OK') {
    throw new Error(res.toString());
  }
  return res;
}
