var express = require('express');
var sqlPool = require('../sqlPool.js');
const uuid = require('node-uuid');
var router = express.Router();
let multer = require('multer');
let fs = require('fs')
let upload = multer({dest: './public/upload'})

/* GET home page. */
router.post('/avatar', upload.single('avatar'),function(req, res, next) {
  const {decodeToken} = req;
  var oldFile = req.file.destination + '/' + req.file.filename;
  var newName = uuid.v1() + '.' + req.file.mimetype.split('/')[1];
  var newFile = req.file.destination + '/' + newName;
  console.log('req.file', req.file)


  fs.rename(oldFile, newFile, function(err){
    if(err){
      console.log('上传失败', err)
    }else{
      console.log('上传成功')
      let src = 'http://127.0.0.1:3000/upload/' + newName;
      sqlPool.getSeedBaseInfoCount(`update admin set avatar='${src}' where username='${decodeToken}';`).then(function (result) {
          res.send({
            status: 1,
            msg: '上传成功',
            data: src
          })
      }).catch(function (result) {
          res.send(result)
      })
    }
  })
});

module.exports = router;
