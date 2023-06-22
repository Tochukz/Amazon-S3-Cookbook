const express = require('express');
const FileService = require('../services/file.service');
const { route } = require('.');
const router = express.Router();

const fileService = new FileService();

router.get('/', function(req, res, next) {
  res.render('file-ops', {title: 'File Operations'});
});

router.get('/files', async function (req, res, next) {
  try {
    const files =  await fileService.listFiles();   
    res.json(files);
  } catch(err) {
    next(err);
  }
});

router.post('/api-upload', function(req, res, next) {
  //@todo: Try direct upload from backend.
});

router.get('/signed-url', async function(req, res, next)  {
  try {
    const key = req.query.name;
    const result = await fileService.getSignedUrl(key);
    return res.json(result);
  } catch(err) {
    next(err);
  }
});

router.post('/presign-url', async function(req, res, next) {
  try {
  const { files } = req.body;

  if (!Array.isArray(files)) {
    const message = 'files must be an array file object';
    return res.status(400).json({ message });
  }
  if (files.some(file => !file.name || !file.type || !file.size)) {
    const message = 'Each file object must have a name and type and size';
    return res.status(400).json({ message });
  }

  const result = await fileService.getMultiPresingedUrl(files);
  res.status(201).json(result);
  } catch(err) {
    next(err);
  }
});

router.get('/large-files', async (req, res, next) => {
  return res.render('large-files', {title: 'Multipart Large Files using'});
});

router.post('/large-presigned-urls', async (req, res, next) => {
  try {
  const {chunkLength, file} = req.body;
  const data = await fileService.startMultipartUpload(file);  
  const { UploadId: uploadId, Key: key} = data;
  const signedUrls = await fileService.getMultipartUrls(key, uploadId, chunkLength);
  return res.json({ uploadId, key, signedUrls});
  } catch(err) {
    return next(err);
  }
});

router.post('/large-upload-complete', async(req, res, next) => {
  try {
    const { uploadId, file, parts } = req.body; 
    const response = await fileService.completeLargeUpload(uploadId, file, parts)
    return res.json(response);
  } catch(err) {
    return next(err);
  }
});

router.delete('/delete-file/:fileName', async (req, res, next) => {
  try {
    const fileName = req.params.fileName;
    const result = await fileService.deleteFile(fileName);
    //@todo: Delete file from the database.
    return res.status(204).json({});
  } catch(err) {
    return next(err);
  }
})

module.exports = router;
