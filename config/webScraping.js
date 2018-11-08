//임시 크롤링 방법 - 동적 웹페이지를 끌어올 수 있는 좀더 정형화된 크롤링 방법을 생각해보자

//크롤링을 위한 npm
const cheerio = require('cheerio-httpcli');
//크롤링을 자유자재로 다루기 위한 url npm
const url= require('url');

const db = require('../models/db_con');
var db_connection  = db.init();
db_connection.query('use dogfooddb');

//queries
var insertFoodInfo = "insert into products (product_id, name_en,type, feedTo, company)\
 values (?,?,?,?,?)";
var insertNutritionInfo ="insert into nutritions (product_id, protein , fat, crude_fibre, crute_ash, moisture)\
 values (?,?,?,?,?,?)"
//-dogfoodadviser는 크롤러들을 막아놓음
//따라서 allaboutdogfood라는 영국 사이트를 이용
let adr ="https://www.allaboutdogfood.co.uk/_directory_getresults.php?dir=foods&weight_set=0&age_set=0&rating_in=0.1,5.0&cost_in=0.10,5.00&limit=undefined&rank_by=10&page=1\
&brand_all=1&breed_in=M&dog_type=0&types%5B%5D=complete_dry&types%5B%5D=complete_extruded&types%5B%5D=complete_baked&types\
%5B%5D=complete_cold_pressed&types%5B%5D=complete_air_dried&types%5B%5D=complete_freeze_dried&types%5B%5D=complete_semi_moist&types%5B%5D=complete_muesli&types%5B%5D=complete_wet&types%5B%5D=complete_raw\
&types%5B%5D=mixer&types%5B%5D=complimentary_extruded&types%5B%5D=complimentary_baked&types%5B%5D=complimentary_muesli&types%5B%5D=complimentary&types%5B%5D=complimentary_wet&types%5B%5D=complimentary_raw&types%5B%5D=complete_fresh&country%5B%5D=Europe&country%5B%5D=North%20America&country\
%5B%5D=Asia&country%5B%5D=Rest%20of%20World&country%5B%5D=United%20Kingdom&country%5B%5D=Canada&country%5B%5D=Czech%20Republic&country%5B%5D=Denmark&country%5B%5D=France&country%5B%5D=Germany&country%5B%5D=Ireland&country%5B%5D=Italy&country%5B%5D=Netherlands&country%5B%5D=New%20Zealand&country%5B%5D=Norway&country%5B%5D=Portugal&country%5B%5D=Serbia&country%5B%5D=Spain&country%5B%5D=Sweden&country%5B%5D=United%20States"

//아래 얘는 adr에서 onclick 속성으로 더 자세히 뽑을 수 있다.
var foodDetailAdr="https://www.allaboutdogfood.co.uk/_review_getvariety.php?id=0001";

//뽑아온 크롤링들을 배열로 일단 저장.
let product_raw ={
  product_id: [],
  name_en: [],
  nutrition: [],
  foodType: [],
  suitable: [],
  packSizes: [],
  company: [],
  foodCountry: []
};
//상품 id 묶음으로 저장
let product = {
    data : []
};
let nutrient ={
  nut_name: [],
  percent: []
}
var detail_parsed_url = url.parse(foodDetailAdr, true);

//크롤링이 끝났는지 안끝났는지 확인
let count=0;
//product_id가 들어가 있는 url
let docInfoUrl;
let parsedDoc;



exports.scrape = function(first, last)
{
  console.log("크롤링 긁어오는 중 ");
  //cheerio-httpcli는 onclick=""과 같은 동작처리는 지원하지 않는다.
  for( i = first; i<=last; i++)
  {
    //url id 합성하기
    detail_parsed_url.query.id = i;
    delete detail_parsed_url.search;
    foodDetailAdr = url.format(detail_parsed_url);

    //fetch는 비동기적으로 실행  (성능을 높이기 위함 )
    let p = cheerio.fetch(foodDetailAdr)
    p.then((result)=>{
      count++;
      var Name_en = result.$('h1').text().trim();
      //앞뒤 필요없는 공백 없애기
      if(Name_en !=' ')
      {
        //취득한  웹페이지에 대한 정보 url을 얻는다 ( foodDetailAdr는 비동기적으로 실행되기 때문에 id값을 얻을 수 없다 )
        docInfoUrl = result.$.documentInfo().url;
        parsedDoc = url.parse(docInfoUrl, true);
        product_raw.product_id.push(parsedDoc.query.id);

        //상품명
        product_raw.name_en.push(Name_en);

        //영양소 배열
        var nutrition_raw =  result.$('table#review_nutrition_table .full_width p').text();
        //크롤링한 영양소의 하나의 string을 영양소의 배열로 분할한다.
        nutrition = nutrition_raw.split(";").map(function(e){
          return e.trim().split(" ");
        })
        console.log(nutrition);
        product_raw.nutrition.push(nutrition);

        //food type 건식 사료
        product_raw.foodType.push(result.$("table#fact_table tr:nth-child(2) td:nth-child(2)").text().trim());

        var suitable =  result.$("table#fact_table tr:nth-child(3)>td:nth-child(2)").text();
        product_raw.suitable.push(suitable.trim());

        var packSizes = result.$("table#fact_table tr:nth-child(4)>td:nth-child(2)").text();
        console.log(packSizes);
        product_raw.packSizes.push(packSizes.trim());

        var company = result.$("table#manufacturer_fact_table tr:nth-child(1)>td:nth-child(2)>b").text();
        product_raw.company.push(company.trim());

        var foodCountry =result.$("table#fact_table tr:nth-child(7)>td:nth-child(2)").text();
        product_raw.foodCountry.push(foodCountry.trim());
        console.log("--------------------------");
      }
    });
    //Well ETIMEDOUT means something couldn't keep up with the pace you were throwing at it.
    p.catch(function(err){
      console.log(err);
    });
    p.finally(function(){
        console.log('done')
    })
  }
  if(count == last-first+1)
  {
    console.log("크롤링 끝남 ");
  }
  return setTimeout(function(){
      count=0;
      for(var i=0; i<product_raw.product_id.length; i++){
        if(product_raw.name_en[i] !=' '){
          count++;
                  product.data[i] = {
                        product_id : product_raw.product_id[i],
                        name_en : product_raw.name_en[i],
                        nutrition :product_raw.nutrition[i],
                        foodType : product_raw.foodType[i],
                        suitable : product_raw.suitable[i],
                        packSizes : product_raw.packSizes[i],
                        company : product_raw.company[i],
                        foodCountry : product_raw.foodCountry[i]
                  }
                  console.log(product.data[i]);
                  /*
                  console.log(product.data[i].company);
                  console.log(product.data[i].foodCountry);
                  if(product.data[i].company != ' '){
                    db_connection.query("select * from dogfooddb.company where company_name = ?", product.data[i].company, function(err, result){
                      if(err){
                        return done(err);
                      }else{
                        if(result.length == 0){
                          console.log("new company");
                          db_connection.query("insert into dogfooddb.company set company_name = ?, country = ?", [product.data[i].company, product.data[i].foodCountry], function(err, result){
                            if(err){
                              return done(err);
                            }
                            console.log("insert 성공!");
                          })
                        } else{
                          console.log("old company");
                        }
                      }
                    })
                  }


                  //product_id, name_en,type, feedTo, company)
                  /*
                  db_connection.query(insertFoodInfo, [product.data[i].product_id, product.data[i].name_en
                    ,product.data[i].foodType, product.data[i].suitable,  product.data[i].company  ], function(err, result){
                      if(err){
                        console.log("error: "+err);
                        return done(false, null);
                      }else{
                        console.log("product insert 성공");
                      }
                  });  //300까지 디비 저장 완료
                  */
                  //insert nutrition info
                  //product_id, protein , fat, crude_fibre, crute_ash, moisture
                  /*
                  db_connection.query("insertNutritionInfo", [], function(err, result){
                    if(err){
                      console.log("error insert nutrition: "+err);
                      return done(false, null);
                    }else {
                      console.log("nutrition insert 성공")
                    }
                  })*/
                }
              }

  },10000)
}
