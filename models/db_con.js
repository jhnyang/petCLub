
//데이터베이스 mysql 연동
const mysql = require('mysql');

var db = {
  //init 이라는 함수 속성 부여
  init: function(){
    //database 연결
    return mysql.createConnection({
      //3306 port
      host: 'localhost',
      user:'root',
      password: 'qwer0520',
      database: 'dogfoodDB',
      port: 3306
    });
  },
  connect_check: function(conn){
    conn.connect(function(err){
      if(err) throw err;
      console.log(" DB Connected!");
      
    });
  }
}
module.exports = db;
