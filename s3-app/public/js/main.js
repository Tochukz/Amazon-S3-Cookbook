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
    console.log(files, !Array.isArray(files));
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
  const fileInput = elem(fileId);
  const files = fileInput.files;
  if (!files.length) {
    $('#alert').text('No file selected').addClass('alert-danger').show();
    return;
  }
  const file = fileInput.files[0];
  const {type, name, size} = file;
  console.log({type, name, size});
  const presignedUrl =  await getPresignedUrl({type, name, size});
  sendToS3(presignedUrl, file);
  console.log({presignedUrl});
}

async function getPresignedUrl(data) {
  try { 
    const res = await fetch('/file-operations/presign', { method: 'POST', body: data});
    const result = await res.json();
    return result;
  } catch(err) {
    console.error(err);
  }
}

async function sendToS3(presignedUrl, file) {
  const res = await fetch(presignedUrl, {method: 'PUT', body: file});
  return res.data;
}
