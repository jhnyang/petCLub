const express = require('express');
const router = express.Router();
const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
const KakaoStrategy = require('passport-kakao').Strategy;
const LocalStrategy = require('passport-local').Strategy;

router.get('/', function(req, res, next){
  res.render('login',{ title: 'About Us' });
});
router.post('/', passport.authenticate('login', {
  //실패하면 /loign 페이지
  failureRedirect: '/', failureFlash: true}),
  function (req, res){
    //성공하면 main 페이지로
      res.redirect('/');
  }
);
//'/kakao'로 접근하면 clientID와 secret등의 정보를 카카오로 보내내고 인증은 카카오에서 해준다.
// 이 후 인증이 완료되면 토큰과 사용자 정보는 callback주소로 보내주고 이 정보를 바탕으로 사용자의 정보를 알 수 있다.
router.get('/kakao', passport.authenticate('kakao-login'));
//카카오 로그인 연동 콜백
router.get('/oauth/kakao/callback', passport.authenticate('kakao-login',{
  //인증이 성공적으로 되면 '/profile'로 리 다이렉션 된다.
  successRedirect: '/',
  failureRedirect :'/login'
}));

// facebook 로그인
router.get('/facebook',  passport.authenticate('facebook-login'));
// facebook 로그인 연동 콜백
router.get('/auth/facebook/callback',  passport.authenticate('facebook-login', {
    successRedirect: '/',
    failureRedirect: '/login'
  })
);

module.exports = router;
