function elem(id) {
  return document.getElementById(id);
}

function getFileName(filePath) {
  const bits = filePath.split("/");
  return bits[bits.length-1];
}

function displayError(response) {
  const { statusText, url, message} = response;
  $(".alert").html(`<p>${url}</p><p>${ message || statusText}</p>`)
  $(".alert").addClass('alert-danger')
  $(".alert").slideDown();
  console.error(response);
}

function hideError() {
  $(".alert").slideUp();
}

async function loadFiles() {
  try {
    const response = await fetch('/file-operations/files');    
    if (response.status != 200) {
      displayError(response);
      return;
    }
    const files = await response.json();
    if (!Array.isArray(files)) {
      return;
    }
    $('#tbody').empty();
    files.forEach(file => {
      $('#tbody').append(`
        <tr> 
          <td class="file-name" onclick="displayFile('${file.key}')">${getFileName(file.key)}</td>
          <td class="file-name">
            <button class="btn btn-primary btn-sm" onclick="displayFile('${file.key}')">Display</button>
          </td>
          <td>${file.size}</td>
          <td>${file.lastModified}</td>
          <td>
            <i class="fa fa-trash" onclick="deleteFile('${file.key}')"></i>
          </td>
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

async function deleteFile(fileKey) {
  const bits = fileKey.split('/');
  const filename = bits[bits.length-1];
  const yesDelete = confirm(`Are you sure you want to delete ${filename}`);
  if (yesDelete) {
    console.log('deleting');
    //Todo: Implement delete operation 
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
    $('#alert').text('No file selected').addClass('alert-danger').slideDown();
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
    $('#alert').removeClass('alert-danger')
               .addClass('alert-success')
               .html(`<p>Uploaded ${n} file(s)<p>`)
               .slideDown();
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
    displayError(res);
    throw new Error(res.toString());
  }
  return res;
}

function createChunks(file, chunkSize) {
  // chunkSize should be in byte 1024*1 = 1KB 
  let startPointer = 0;
  const endPointer = file.size;
  const chunks = [];
  while(startPointer < endPointer){
   const newStartPointer = startPointer + chunkSize;
   chunks.push(file.slice(startPointer, newStartPointer));
   startPointer = newStartPointer;
  }
  return chunks;
}

async function startLargeUpload() {
  hideError();
  const largeFile = elem('largeFile')
  const files = largeFile.files
  if (!files.length) {
    displayError({ statusText: 'No file selected!'})
    return;
  }
  const file = files[0];
  const {type, name, size} = file;
  const  chunkSize = (1024 * 1000) * 5 // 5MB
  const chunks = createChunks(file, chunkSize);
  const chunkLength = chunks.length;
  const data = await getChuckPresignedUrls({type, name, size}, chunkLength);
  const { uploadId, signedUrls } = data;
  const uploads = []
  for (let i = 0; i < chunks.length; i++) {
    const signedUrl = signedUrls[i].signedUrl;
    const chunk = chunks[i]
    uploads.push(fetch(signedUrl, {method: 'PUT', body: chunk})); 
  }
  const results = await Promise.all(uploads);
  const parts = results.map((result, i) => {
     const ETag = result.headers.get('ETag') || result.headers.get('etag') || result.headers.get('Etag');
     return {
      ETag,
      PartNumber: signedUrls[i].partNumber,
     }
  });
  const data2  = await completeLargeUpload(uploadId, {type, name, size}, parts);
}

async function getChuckPresignedUrls(fileInfo, chunkLength) {
  const response = await fetch('/file-operations/large-presigned-urls', { 
    method: 'POST', 
    body: JSON.stringify({
      chunkLength,
      file: fileInfo,     
    }),
    headers: {
      'Content-Type': 'application/json',
    }
  });
  if (response.status != 200) {
    displayError(response);
    return;
  }
  return response.json();
}

async function completeLargeUpload(uploadId, fileInfo, parts) {
  const response = await fetch('/file-operations/large-upload-complete', {
    method: 'POST', 
    body: JSON.stringify({
      uploadId,
      file: fileInfo,
      parts,
    }),
    headers: {
      'Content-Type': 'application/json',
    }
  });
  
  if (response.status != 200) {
    displayError(response);
    return;
  }
  return response.json();
}