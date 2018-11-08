const KakaoStrategy=require('passport-kakao').Strategy;
const LocalStrategy = require('passport-local').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const db = require('../models/db_con');

//database연동
var db_connection  = db.init();
db.connect_check(db_connection);
db_connection.query('use dogfooddb');

//http://www.passportjs.org/docs/downloads/html/
module.exports = function(passport)
{
  //로그인 성공시 사용자 정보를 session에 저장한다.
  //if authentication succeeds, a session will be established and maintained via a cookie set in the user's browser
  passport.serializeUser(function(user, done){
    //두번째 argument인 done부분에 저장된 user.id정보는 세션에 저장된다.
    //그리고 나중에 deserializeUser 함수에서 전체 object를 찾는데 사용된다.
    //serializeUser는 user object에서 어떤 data가 세션에 저장되어질지 결정한다.
    //serializeUser를 통한 결과는 req.session.passport.user={}에 더해짐.
    //ex) req.session.passport.user={id: 'xyz'}
      done(null, user);
      //https://stackoverflow.com/questions/27637609/understanding-passport-serialize-deserialize
      //user.id도 되지만 user itself가 저장될 수도 있다.
  })
  passport.deserializeUser(function (user, done){
    done(null,user);
  })

  passport.use('login',new LocalStrategy({
      usernameField: 'username',
      passwordField: 'password',
            ///인증을 수행하는 인증 함수로 HTTP request를 그대로 전달할지 여부를 결정한다
      passReqToCallback: true
  }, function(req, username, password, done){
    db_connection.query('select * from users where user_id=?',username, function (err, result){
      if(err){
        console.log("error: "+err);
        return done (false, null);
      }else {
        if(result.length == 0){
          console.log("result 0개 해당 유저를 찾을 수 없음");
          return done(false, null, req.flash("해당 유저를 찾을 수 없습니다."));
        }else{ //결과 값이 존재할 경우
          //패스워드가 일치할 경우와 일치하지 않을 경우로 나눈다.
          if(result[0].password==password){
            console.log("로그인 성공 ");
            return done(null, {
              //로그인이 성공했으면 세션에다가 정보를 저장

            })
          }else{
            console.log("패스워드가 일치하지 않는다");
            return done(false, null, req.flash("패스워드가 일치하지 않는다 "));
          }
        }
      }
    })
  }));

  //profile은 auth_type: 'facebook, kakao 등', auth_id(profile.id), auth_name(profile.nickname), auth_email(profile.email)
  //third party에 의해서 가입된 유저들에 대해서
  //디비에 저장된 것이 없다 => 신유저 => 디비에 저장시킴
  //queries
  var checkDuplicatedUsers_Query ="select * from users where user_id=?";
  var thirdpartySignup_Query ="insert into users set user_id = ?, nickname = ?";

  function loginByThirdParty(info, done){
    console.log('process: '+info.auth_type);

    db_connection.query(checkDuplicatedUsers_Query, info.auth_id, function(err, result){
      if(err){
        return done(err);
      }else{
        if(result.length == 0){
          //아이디가 일치하는 것이 없으니 신규 유저로 인식. 가입시켜줌. (인증 후 임)
          db_connection.query(thirdpartySignup_Query, [info.auth_id, info.auth_name], function(err, result){
            if(err){
              return done(err);
            }else{
              done(null, {
                'user_id': info.auth_id,
                'nickname': info.auth_name,
              })
            }
          })
        } else{
          //결과값이 0개가 아니므로 기존에 로그인 된적이 있다고 생각.
          console.log("old user");
          done(null, {
            'user_id': result[0].user_id,
            'nickname': result[0].nickname
          })
        }
      }
    })
  };

  passport.use('kakao-login', new KakaoStrategy({
    clientID: 'e8729be347b50881ad425b6704b874e5',
    callbackURL: 'http://localhost:3000/login/oauth/kakao/callback'
  },
  //accessToken: token을 이용해서 카카오 오픈 API를 호출 refreshToken: token이 만료되었을 때 재발급 요청
  function(accessToken, refreshToken, profile, done){
    //사용자의 정보는 profile에 들어 있다.
    var _profile = profile._json;
    console.log("kakao login info");
    console.log(_profile);

    loginByThirdParty({
      'auth_type': 'kakao',
      'auth_id': _profile.id, //792470317,
      'auth_name': _profile.properties.nickname, //혀니♥
      'auth_email': _profile.kaccount_email
    }, done);
  }));

  passport.use('facebook-login', new FacebookStrategy({
    clientID: 1399279306840113,
    clientSecret: "aa198ac54213cc75e2e1e2af5e26c659",
    callbackURL: "http://localhost:3000/login/auth/facebook/callback",
    profileFields: ['id', 'email', 'gender', 'link', 'locale', 'name', 'timezone',
      'updated_time', 'verified', 'displayName']
  }, function (accessToken, refreshToken, profile, done) {
    console.log(profile);

    var _profile = profile._json;
    console.log('Facebook login info');
    console.log(_profile);

    loginByThirdParty({
      'auth_type': 'facebook',
      'auth_id': _profile.id, //1137351626406019,
      'auth_name': _profile.name, //JI Hyun Yang
    }, done);

  }));
};
