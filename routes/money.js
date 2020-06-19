var express = require('express');
const { check, validationResult } = require('express-validator');
var sqlPool = require('../sqlPool.js');

var router = express.Router();

//消费记录列表
router.post('/list', [
  check('page_num').isInt({min:0}),
  check('page_size').isInt({min:1}),
  check('mobile').if(check('mobile').exists()).custom((value, { req }) => value === '' || check('mobile').isMobilePhone()),
  check('pay_type').custom((value, { req }) => value === '' || check('pay_type').isIn([0, 1])),
  check('oprate_admin').if(check('oprate_admin').exists()).custom((value, { req }) => value === '' || check('oprate_admin').isString()),
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
  const {page_num, page_size, mobile, pay_type, oprate_admin, start_time, end_time } = req.body;
  var tempO = { mobile, pay_type, oprate_admin, start_time, end_time }
  var start = (page_num - 1) * page_size;
  var sqlStr = 'select * from bill';
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
      res.send({
        status: 1,
        msg: '请求成功',
        data: result
      })
  }).catch(function (result) {
      res.send(result)
  })
});
//消费记录总数
router.post('/list-count', [
  check('page_num').isInt({min:0}),
  check('page_size').isInt({min:1}),
  check('mobile').if(check('mobile').exists()).custom((value, { req }) => value === '' || check('mobile').isMobilePhone()),
  check('pay_type').custom((value, { req }) => value === '' || check('pay_type').isIn([0, 1])),
  check('oprate_admin').if(check('oprate_admin').exists()).custom((value, { req }) => value === '' || check('oprate_admin').isString()),
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
  const {page_num, page_size, mobile, pay_type, oprate_admin, start_time, end_time } = req.body;
  var tempO = { mobile, pay_type, oprate_admin, start_time, end_time }
  var start = (page_num - 1) * page_size;
  var sqlStr = 'SELECT COUNT(*) FROM bill';
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
      res.send({
        status: 1,
        msg: '请求成功',
        data: result[0]['COUNT(*)']
      })
  }).catch(function (result) {
      res.send(result)
  })
});
//会员充值
router.post('/recharge', [
  check('mobile').isMobilePhone(),
  check('money').isInt({min:1}),
  check('payment_type').isIn([0, 1, 2])
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
  const {mobile, money, payment_type, remark} = req.body;
  const timeStamp = Math.round(Date.now()/1000)
  sqlPool.getSeedBaseInfoCount(`SELECT balance FROM user WHERE mobile='${mobile}';`).then(function (result) {
      let tempMoney = result[0].balance;
      tempMoney = tempMoney + money;
      if(tempMoney >= 0){
          //balance充值
          sqlPool.getSeedBaseInfoCount(`UPDATE user SET balance=${tempMoney} WHERE mobile='${mobile}';`).then(function (result) {
            //会员交易记录
            sqlPool.getSeedBaseInfoCount(`INSERT INTO bill (mobile,pay_type,pay_price,create_time,oprate_admin,remark) VALUES ('${mobile}',0,${money},${timeStamp},'${decodeToken}','${remark}');`).then(function (result) {
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
            //店铺流水
            sqlPool.getSeedBaseInfoCount(`INSERT INTO payment (mobile,consume_type,payment_type,pay_price,create_time,oprate_admin,remark) VALUES ('${mobile}',0,${payment_type},${money},${timeStamp},'${decodeToken}','${remark}');`).then(function (result) {
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
          msg: '用户余额不能为负数'
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
//临时消费
router.post('/temporary-pay', [
  check('payment_type').isIn([0, 1, 2]),
  check('money').isInt({min:1})
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
  const {money, remark, payment_type} = req.body;
  const timeStamp = Math.round(Date.now()/1000)
  //店铺流水
  sqlPool.getSeedBaseInfoCount(`INSERT INTO payment (mobile,consume_type,payment_type,pay_price,create_time,oprate_admin,remark) VALUES (0,1,${payment_type},${money},${timeStamp},'${decodeToken}','${remark}');`).then(function (result) {
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

//会员消费
router.post('/member-pay', [
  check('mobile').isMobilePhone(),
  check('money').isInt({min:1})
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
  const {mobile, money, remark} = req.body;
  const timeStamp = Math.round(Date.now()/1000)
  sqlPool.getSeedBaseInfoCount(`SELECT balance FROM user WHERE mobile='${mobile}';`).then(function (result) {
      if(result.length === 0){
        res.send({
          status: 0,
          msg: '没有该会员',
          data: ''
        })
        return;
      }
      let tempMoney = result[0].balance;
      tempMoney = tempMoney - money;
      if(tempMoney >= 0){
          //balance充值
          sqlPool.getSeedBaseInfoCount(`UPDATE user SET balance=${tempMoney} WHERE mobile='${mobile}';`).then(function (result) {
            //会员交易记录
            sqlPool.getSeedBaseInfoCount(`INSERT INTO bill (mobile,pay_type,pay_price,create_time,oprate_admin,remark) VALUES ('${mobile}',0,${money},${timeStamp},'${decodeToken}','${remark}');`).then(function (result) {
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
          msg: '用户余额不能为负数'
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

//营收列表
router.post('/revenue-list', [
  check('page_num').isInt({min:0}),
  check('page_size').isInt({min:1}),
  check('mobile').if(check('mobile').exists()).custom((value, { req }) => value === '' || check('mobile').isMobilePhone()),
  check('consume_type').custom((value, { req }) => value === '' || check('pay_type').isIn([0, 1])),
  check('payment_type').custom((value, { req }) => value === '' || check('payment_type').isIn([0, 1, 2])),
  check('oprate_admin').if(check('oprate_admin').exists()).custom((value, { req }) => value === '' || check('oprate_admin').isString()),
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
  const {page_num, page_size, mobile, consume_type, payment_type, oprate_admin, start_time, end_time } = req.body;
  var tempO = { mobile, consume_type, payment_type, oprate_admin, start_time, end_time }
  var start = (page_num - 1) * page_size;
  var sqlStr = 'select * from payment';
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
      res.send({
        status: 1,
        msg: '请求成功',
        data: result
      })
  }).catch(function (result) {
      res.send(result)
  })
});
//消费记录总数
router.post('/revenue-count', [
  check('page_num').isInt({min:0}),
  check('page_size').isInt({min:1}),
  check('mobile').if(check('mobile').exists()).custom((value, { req }) => value === '' || check('mobile').isMobilePhone()),
  check('consume_type').custom((value, { req }) => value === '' || check('pay_type').isIn([0, 1])),
  check('payment_type').custom((value, { req }) => value === '' || check('payment_type').isIn([0, 1, 2])),
  check('oprate_admin').if(check('oprate_admin').exists()).custom((value, { req }) => value === '' || check('oprate_admin').isString()),
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
  const {page_num, page_size, mobile, consume_type, payment_type, oprate_admin, start_time, end_time } = req.body;
  var tempO = { mobile, consume_type, payment_type, oprate_admin, start_time, end_time }
  var start = (page_num - 1) * page_size;
  var sqlStr = 'SELECT COUNT(*) FROM payment';
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
      res.send({
        status: 1,
        msg: '请求成功',
        data: result[0]['COUNT(*)']
      })
  }).catch(function (result) {
      res.send(result)
  })
});

//
module.exports = router;
