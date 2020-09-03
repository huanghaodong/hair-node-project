var express = require('express');
const { check, validationResult } = require('express-validator');
var sqlPool = require('../sqlPool.js');
var router = express.Router();


/* 当日收入统计 */
router.post('/revenue-today', [
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
  const {start_time, end_time } = req.body;
  var sqlStr = `select sum(if(payment_type=2,pay_price,0)) as ali,sum(if(payment_type=1,pay_price,0)) as wx,sum(if(payment_type=0,pay_price,0)) as cash,sum(pay_price) as total from payment where create_time >= ${start_time} and create_time <= ${end_time}`;
  
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
/* 当日订单统计 */
router.post('/order-today', [
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
  const {start_time, end_time } = req.body;
  var sqlStr = `select count(*) as total, sum(if(payment_type=2,1,0)) as ali,sum(if(payment_type=1,1,0)) as wx,sum(if(payment_type=0,1,0)) as cash from payment where create_time >= ${start_time} and create_time <= ${end_time}`;
  console.log(33333333, sqlStr)  
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

module.exports = router;
