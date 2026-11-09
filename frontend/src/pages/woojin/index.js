import Frame from './Frame';
import Login from './Login';
import Signup from './Signup';
import Mypage from './Mypage';
import ShopLogin from './shop/ShopLogin';

// 우진 담당: 로그인 / 회원가입 / 마이페이지 (팀 메뉴바 없이 자기 화면 전체를 써요)
export const standaloneRoutes = [
  { path: '/login', element: <Frame><Login /></Frame> },
  { path: '/signup', element: <Frame><Signup /></Frame> },
  { path: '/mypage', element: <Frame><Mypage /></Frame> },
  // 쇼핑몰 로그인 확인용 임시 주소: http://localhost:3000/shop/login  (이커머스에 붙이면 이 줄은 지워도 돼요)
  { path: '/shop/login', element: <ShopLogin onSuccess={(member) => window.alert(member.name + '님 로그인 성공!')} /> },
];
