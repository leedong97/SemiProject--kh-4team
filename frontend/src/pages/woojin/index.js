import Frame from './Frame';
import Login from './Login';
import Signup from './Signup';
import Mypage from './Mypage';

// 우진 담당: 로그인 / 회원가입 / 마이페이지 (팀 메뉴바 없이 자기 화면 전체를 써요)
export const standaloneRoutes = [
  { path: '/login', element: <Frame><Login /></Frame> },
  { path: '/signup', element: <Frame><Signup /></Frame> },
  { path: '/mypage', element: <Frame><Mypage /></Frame> },
];
