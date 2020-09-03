
var mySql = require('mysql')
var options = {
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'hhd'
}
var pool = mySql.createPool(options)

var baseInfoSqlFun={};

baseInfoSqlFun.getSeedBaseInfoCount=function(sqlStr){
    return  new Promise(function (resolve, reject) {
        pool.getConnection(function(err, connection) {
            console.log('err', err)
            connection.query(sqlStr,function (error,results,fields) {
                if (error){reject(error)}
                else {resolve(results)};
                connection.release()
                console.log('The solution is:',results);
            })
        })

        
    })
 
}
 
module.exports= baseInfoSqlFun
