const express = require('express');
const FileService = require('../services/file.service');
const router = express.Router();

const fileService = new FileService();

router.get('/', function(req, res, next) {
  res.render('file-ops', {title: 'File Operations'});
});

router.get('/files', async function (req, res, next) {
  try {
    const data =  await fileService.listFiles();
    if (data.Contents) {
      const {Name, Prefix, Marker, MaxKeys, CommonPrefixes, Contents} = data;
      const files = Contents.map(item => ({key: item.Key, lastModified: item.LastModified, size: item.Size}))
      return res.json(files);
    }
    res.json([]);
  } catch(err) {
    next(err);
  }
});

router.post('/api-upload', function(req, res, next) {

});

router.get('/signed-url', async function(req, res, next)  {
  try {
    const key = req.query.key;
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

module.exports = router;
