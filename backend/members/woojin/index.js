// 우진 폴더: 로그인 / 회원가입 / 마이페이지 / 일정 / 프로필 API
// 주소 = prefix + 각 파일 안의 주소.  예) '/api/schedules' + '/' => /api/schedules
// (server.js 는 이 목록을 위에서부터 순서대로 연결해요)
module.exports = {
  routes: [
    { prefix: '/api/health',    router: require('./health') },
    { prefix: '/api',           router: require('./auth') },       // /api/login, /api/signup
    { prefix: '/api/schedules', router: require('./schedules') },
    { prefix: '/api',           router: require('./mypage') },      // /api/leaves, /api/my-...
    { prefix: '/api/profile',   router: require('./profile') },
    { prefix: '/api/notifications', router: require('./notifications') },
  ],
};
