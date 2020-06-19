var express = require('express');
const { check, validationResult } = require('express-validator');
var sqlPool = require('../sqlPool.js');

var router = express.Router();
//查询用户列表
router.post('/list', [
  check('page_num').isInt({min:0}),
  check('page_size').isInt({min:1}),
  check('mobile').custom((value, { req }) => value === '' || check('mobile').isMobilePhone()),
  check('nickname').custom((value, { req }) => value === '' || check('nickname').isString()),
  check('start_time').if(check('start_time').exists()).custom((value, { req }) => value === '' || check('start_time').isInt()),
  check('end_time').if(check('end_time').exists()).custom((value, { req }) => value === '' || check('end_time').isInt())
], function(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.send({ 
      status: 0,
      msg: JSON.stringify(errors.array()),
      data: ''
     });
  }
  const {page_num, page_size, mobile, nickname, start_time, end_time } = req.body;
  var tempO = { mobile, nickname, start_time, end_time }
  var start = (page_num - 1) * page_size;
  var sqlStr = 'select * from user';
  var tempStr = Object.keys(tempO).reduce(function(t,v){
    if(tempO[v]!=='' && tempO[v]!==undefined){
      if(v === 'start_time'){
        t += ` and create_time >= ${start_time}`
      }else if(v === 'end_time'){
        t += ` and create_time <= ${end_time}`
      }else{
        t += ` and ${v}='${tempO[v]}'`
      }
    }
    return t
  }, '')
  if(tempStr){
    sqlStr = `${sqlStr} where ${tempStr.slice(4)} order by create_time desc limit ${start}, ${page_size}`
  }else{
    sqlStr = `${sqlStr} order by create_time desc limit ${start}, ${page_size}`
  }
  console.log('sqlStr', sqlStr )
  sqlPool.getSeedBaseInfoCount(sqlStr).then(function (result) {
      res.send({
        status: 1,
        msg: '请求成功',
        data: result
      })
  }).catch(function (result) {
    res.send({
      status: 0,
      msg: result,
      data: ''
    })
  })
});
//查询用户总数
router.post('/count', [
  check('page_num').isInt({min:0}),
  check('page_size').isInt({min:1}),
  check('mobile').custom((value, { req }) => value === '' || check('mobile').isMobilePhone()),
  check('nickname').custom((value, { req }) => value === '' || check('nickname').isString()),
  check('start_time').if(check('start_time').exists()).custom((value, { req }) => value === '' || check('start_time').isInt()),
  check('end_time').if(check('end_time').exists()).custom((value, { req }) => value === '' || check('end_time').isInt())
],
 function(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.send({ 
      status: 0,
      msg: JSON.stringify(errors.array()),
      data: ''
     });
  }
  const {page_num, page_size, mobile, nickname, start_time, end_time } = req.body;
  var tempO = { mobile, nickname, start_time, end_time }
  var start = (page_num - 1) * page_size;
  var sqlStr = 'SELECT COUNT(*) FROM user';
  var tempStr = Object.keys(tempO).reduce(function(t,v){
    if(tempO[v]!=='' && tempO[v]!==undefined){
      if(v === 'start_time'){
        t += ` and create_time >= ${start_time}`
      }else if(v === 'end_time'){
        t += ` and create_time <= ${end_time}`
      }else{
        t += ` and ${v}='${tempO[v]}'`
      }
    }
    return t
  }, '')
  if(tempStr){
    sqlStr = `${sqlStr} where ${tempStr.slice(4)} order by create_time desc limit ${start}, ${page_size}`
  }else{
    sqlStr = `${sqlStr} order by create_time desc limit ${start}, ${page_size}`
  }
  sqlPool.getSeedBaseInfoCount(sqlStr).then(function (result) {
    console.log(123, result)
      res.send({
        status: 1,
        msg: '请求成功',
        data: result[0]['COUNT(*)']
      })
  }).catch(function (result) {
    res.send({
      status: 0,
      msg: result,
      data: ''
    })
  })
});

//根据手机号模糊查询用户列表
router.post('/query-user-by-mobile', [
  check('mobile').isLength({min: 1, max: 11}),
], function(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.send({ 
      status: 0,
      msg: JSON.stringify(errors.array()),
      data: ''
     });
  }
  const { mobile } = req.body;
  var sqlStr = `select * from user where mobile like '%${mobile}%' order by create_time desc limit 0,10`;
  sqlPool.getSeedBaseInfoCount(sqlStr).then(function (result) {
      res.send({
        status: 1,
        msg: '请求成功',
        data: result
      })
  }).catch(function (result) {
    res.send({
      status: 0,
      msg: result,
      data: ''
    })
  })
});
//新增用户
router.post('/add', [
  check('nickname').isLength({min: 1}),
  check('mobile').isMobilePhone(),
  check('gender').isIn([0, 1]),
  check('money').isInt({min: 0})
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
  const {nickname, mobile, gender, money} = req.body;
  const timeStamp = Math.round(Date.now()/1000);
  sqlPool.getSeedBaseInfoCount(`INSERT INTO user (nickname,gender,balance,mobile,create_time, oprate_admin) VALUES ('${nickname}',${gender},${money},${mobile},${timeStamp}, '${decodeToken}');`).then(function (result) {
      res.send({
        status: 1,
        msg: '请求成功',
        data: ''
      })
  }).catch(function (result) {
    res.send({
      status: 0,
      msg: result,
      data: ''
    })
  })
});
//删除用户
router.post('/delete', [
  check('mobile').isMobilePhone(),
], function(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.send({ 
      status: 0,
      msg: JSON.stringify(errors.array()),
      data: ''
     });
  }
  const {mobile} = req.body;
  sqlPool.getSeedBaseInfoCount(`DELETE from user WHERE mobile='${mobile}';`).then(function (result) {
      res.send({
        status: 1,
        msg: '请求成功',
        data: ''
      })
  }).catch(function (result) {
    res.send({
      status: 0,
      msg: result,
      data: ''
    })
  })
});
//修改用户（暂时不提供修改手机号功能）
router.post('/update', [
  check('nickname').isLength({min: 1}),
  check('mobile').isMobilePhone(),
  check('gender').isIn([0, 1])
], function(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.send({ 
      status: 0,
      msg: JSON.stringify(errors.array()),
      data: ''
     });
  }
  const {nickname, gender, mobile} = req.body;
  sqlPool.getSeedBaseInfoCount(`UPDATE user SET nickname='${nickname}',gender=${gender} WHERE mobile='${mobile}';`).then(function (result) {
      res.send({
        status: 1,
        msg: '请求成功',
        data: ''
      })
  }).catch(function (result) {
    res.send({
      status: 0,
      msg: result,
      data: ''
    })
  })
});
module.exports = router;
