var express = require('express');
var sqlPool = require('../sqlPool.js');
var JwtUtil = require('../token');
const { check, validationResult } = require('express-validator');
var router = express.Router();

//管理员登录
router.post('/login', [
  check('username').isString(),
  check('password').isString()
], function(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.send({ 
      status: 0,
      msg: JSON.stringify(errors.array()),
      data: ''
     });
  }
  const {username, password} = req.body;
  sqlPool.getSeedBaseInfoCount(`select * from admin where username="${username}" and password="${password}";`).then(function (result) {
    if(result.length === 0){
      res.send({
        status: 0,
        msg: '用户名或密码错误',
        data: ''
      })
    }else{
      let jwt = new JwtUtil(username);
      let token = jwt.generateToken();
      res.send({
        status: 1,
        msg: '登录成功',
        data: {
          token
        }
      })
    }
  }).catch(function (result) {
    res.send({
      status: 0,
      msg: result,
      data: ''
    })
  })
});
//管理员信息
router.post('/userinfo', function(req, res, next) {
  const {decodeToken} = req;
  sqlPool.getSeedBaseInfoCount(`select * from admin where username="${decodeToken}";`).then(function (result) {
    res.send({
      status: 1,
      msg: '请求成功',
      data: result[0]
    })
  }).catch(function (result) {
      res.send({
        status: 0,
        msg: result,
        data: ''
      })
  })
});
//修改密码
router.post('/change-password', [
  check('new_password').isString().isLength({min: 6}),
  check('old_password').isString().isLength({min: 6})
], function(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.send({ 
      status: 0,
      msg: JSON.stringify(errors.array()),
      data: ''
     });
  }
  const {decodeToken} = req;
  const {new_password, old_password} = req.body;
  sqlPool.getSeedBaseInfoCount(`select password from admin where username='${decodeToken}';`).then(function (result) {
    if(result[0].password === old_password){
      sqlPool.getSeedBaseInfoCount(`UPDATE admin SET password='${new_password}' WHERE username='${decodeToken}';`).then(function (result) {
        res.send({
          status: 1,
          msg: '修改成功',
          data: ''
        })
      }).catch(function (result) {
        res.send({
          status: 0,
          msg: result,
          data: ''
        })
      })
    }else{
      res.send({
        status: 0,
        msg: '原密码错误！',
        data: ''
      })
    }
  }).catch(function (result) {
    res.send({
      status: 0,
      msg: result,
      data: ''
    })
  })
});
module.exports = router;
