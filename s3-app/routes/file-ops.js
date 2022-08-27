var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.render('file-ops', {title: 'File Operations'});
});

module.exports = router;
