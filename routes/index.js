const express = require('express');
const router = express.Router();
const fs= require('fs');

const db = require('../models/db_con');
var db_connection  = db.init();
var joinQuery ="select * from dogfooddb.products as p, dogfooddb.nutritions n where p.product_id = n.product_id and p.product_id = ?"
var leftjoinQuery ="select * FROM dogfooddb.products as p LEFT JOIN dogfooddb.nutritions \
as n ON p.product_id = n.product_id where n.product_id = ?" ;
var insertProduct ="insert into dogfooddb.products (product_id, name_en, type) values (?, ?, ?) ";
var insertNutrient = "insert into dogfooddb.nutrition(product_id, protein, fat) values (?, ?, ?)";
//? 4개
var updateProduct = "update dogfooddb.products set name_en = ?, type = ? , feedTo = ? where product_id = ?";
var deleteProduct ="delete from dogfooddb.products where product_id= ?";

/* GET home page. */
router.get('/', function(req, res ,next) {
  res.render('index', { title: 'Home'});
  //index이름을 가진 ejs를 찾아 html로 변환 후 응답해주는 것
});
router.get('/index-1', function(req, res, next){
  res.render('index-1',{ title: 'About Us' });
})
router.get('/uploadProduct', function(req, res, next){
  res.render('uploadProduct',{ title: 'Update' });
})
router.get('/update/:product_id', function(req, res, next){
  db_connection.query(leftjoinQuery, parseInt(req.params.product_id), function(err, result){
    if(err)
    {
      console.log("db 에러 : "+ err);
    }
    console.log(result);
      res.render('update',{ data: result, title: 'Update' });
  })
})
router.post('/update/:product_id', function(req, res){
  var body = req.body;
  db_connection.query(updateProduct, [body.product_name, body.foodType, body.feedTo, parseInt(req.params.product_id)], function(){
    res.redirect('/services');
  })
})
router.get('/delete/:product_id', function(req, res, next){
  var body = req.body;
  db_connection.query(deleteProduct, parseInt(req.params.product_id), function(){
    res.redirect('/services');
  })
})
router.post('/uploadProduct', function(req,res){
    var body = req.body;
    db_connection.query(insertProduct, [parseInt(body.product_id), body.product_name, body.foodType], function(err){
      if(err)
      {
        console.log("db insert product error :"+err);
      }
      console.log("insertProduct 성공");
    })

    db_connection.query(insertNutrient, [ parseInt(body.product_id), body.protein, body.fat], function(err){
      if(err)
      {
        console.log("db insert nutrient");
      }
        console.log("insertNutrient 성공");
    })
})
router.get("/services",function(req, res){
  db_connection.query("select product_id, name_en, type, feedTo, company from dogfooddb.products", function(err, result, fields) {
    if(err)
    {
      console.log("db 에러 ");
    }
    res.render('services', {data: result, title: 'Services'});
  })
});
router.get('/food_detail/:product_id', function(req, res){
  var productID= parseInt(req.params.product_id);
  console.log(productID );
  db_connection.query(leftjoinQuery, productID,  function(err, result, fields) {
    if(err)
    {
      console.log("db 에러 : "+ err);
    }
    res.render('food_detail', {data: result, title: 'food_detail'});
  });
})

router.get('/index-3', function(req, res, next){
  res.render('index-3',{ title: 'Sign Up'  });
});
router.get('/index-4', function(req, res, next){
  res.render('index-4',{ title: 'Contacts'   });
});

//for search

module.exports = router;
