// 우진 폴더: 로그인 / 회원가입 / 탈퇴 API
// 프론트(우진 담당 /login, /signup, /mypage)가 쓰는 주소를 그대로 유지합니다.
const authRouter = require('./auth');

module.exports = {
  // prefix: 이 라우터를 붙일 주소. '/' 면 /login, /signup, /withdraw 처럼 바로 붙음
  routes: [{ prefix: '/', router: authRouter }],
};
