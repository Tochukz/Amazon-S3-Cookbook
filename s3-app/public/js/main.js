$(document).ready(() => {
  $('#loading-div').slideUp();
})

function elem(id) {
  return document.getElementById(id);
}

function displayError(response) {
  const { statusText, url, message} = response;
  const urlParagraph = url ? `<p>${url}</p>` : '';
  $(".alert").html(`${urlParagraph}<p>${ message || statusText}</p>`)
  $(".alert").addClass('alert-danger')
  $(".alert").slideDown();
  console.error(response);
}

function diplaySuccess(message) {
  $('#alert').removeClass('alert-danger')
             .addClass('alert-success')
             .html(`<p>${message}<p>`)
            .slideDown();
}

function hideError() {
  $(".alert").slideUp();
}

/**
 * Fetch list of files for the API and display them in a table
 */
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
          <td class="file-name" onclick="displayFile('${file.name}')">${file.name}</td>
          <td class="file-name">
            <button class="btn btn-primary btn-sm" onclick="displayFile('${file.name}')">Display</button>
          </td>
          <td>${file.size}</td>
          <td>${file.lastModified}</td>
          <td>
            <i class="fa fa-trash" onclick="deleteFile('${file.name}')"></i>
          </td>
        </tr>
      `);
    }); 
  } catch(err) {
    console.error(err);
  }
}

/**
 * Check if file exist in event object
 */
function checkForFile(event) {
  const files = event.target.files;
  if (files.length ) {
    $('#alert').hide();
  }
}

/**
 * Request for a file given its name. Display the file in iframe
 */
async function displayFile(fileName) {
  try {
    const res = await fetch(`/file-operations/signed-url?name=${fileName}`);
    const { signedUrl } = await res.json();
    $('#frame').attr('src', signedUrl)
  } catch(err) {
    console.error(err);
  }
}

/**
 * Get a presign url to delete file and delete the file 
 */
async function deleteFile(fileName) {
  const yesDelete = confirm(`Are you sure you want to delete ${fileName}`);
  if (yesDelete) {
    const response = await fetch(`/file-operations/delete-file/${fileName}`, {
      method: 'DELETE',          
    });
    if (response.status != 204) {
      displayError(response);
      return;
    }   
    loadFiles();
  }
}

/**
 * Get presigned URL to upload multiple files and upload the files to S3
 */
async function uploadToS3(fileId) {
  hideError();
  $('#button-div').slideUp();
  $('#loading-div').slideDown();
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
    diplaySuccess(`Uploaded ${n} file(s)`);
    loadFiles();
  } catch(err) {
    console.error(err);
  } finally {
    $('#button-div').slideDown();
    $('#loading-div').slideUp();
  }
}

/**
 * Get presign URL 
 */
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

/**
 * Upload file to S3
 */
async function sendToS3(presignedUrl, file) {
  const res = await fetch(presignedUrl, {method: 'PUT', body: file});
  if (res.statusText != 'OK') {
    displayError(res);
    throw new Error(res.toString());
  }
  return res;
}

/**
 * Break down a file into chunks 
 */
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

/**
 * Upload a large file in chunks using mutiplpart upload
 */
async function startLargeUpload() {
  hideError(); 
  const largeFile = elem('largeFile')
  const files = largeFile.files
  if (!files.length) {
    displayError({ message: 'No file selected!'})
    return;
  }
  const file = files[0];
  const {type, name, size} = file;
  const  chunkSize = (1024 * 1000) * 10 // 10MB
  const chunks = createChunks(file, chunkSize);
  const chunkLength = chunks.length;
  if (chunkLength < 3) {
    const mbSize = Math.round(size / (1024 * 1000));
    displayError({ message: `File size of ${mbSize}MB is too small for multipart upload!`})
    return;
  }
  $('#button-div').slideUp();
  $('#loading-div').slideDown();
  try {
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
      const ETag = result.headers.get('ETag');
      return {
        ETag,
        PartNumber: signedUrls[i].partNumber,
      }
    });
    const result = await completeLargeUpload(uploadId, {type, name, size}, parts);  
    diplaySuccess('Multipart upload was usccessful');
  } catch(err) {
    console.error(err);
    displayError(error);
  } finally {
    $('#button-div').slideDown();
    $('#loading-div').slideUp();
  }
}

/**
 * Get presigned URL for multipart chunk upload
 */
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

/**
 * Finilize the upload of chunks using multipart upload
 */
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