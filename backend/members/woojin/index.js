// 우진 폴더: 로그인 / 회원가입 / 마이페이지 / 일정 / 프로필 API
// router.js 안에서 이미 '/api/login', '/api/schedules' 처럼 주소 앞부분을 붙여 놓았으므로
// 메인 서버에서는 prefix '/' 로 연결만 하면 됩니다.
module.exports = {
  routes: [{ prefix: '/', router: require('./router') }],
};
