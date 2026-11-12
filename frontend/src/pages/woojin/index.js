import Frame from './Frame';
import Login from './Login';
import Signup from './Signup';
import Mypage from './Mypage';
import ShopLogin from './shop/ShopLogin';

// 우진 담당: 로그인 / 회원가입 (팀 메뉴바 없이) + 마이페이지 (공통 상단 메뉴 안)
export const shellRoutes = [
  { path: '/mypage', element: <Mypage /> },
];

export const standaloneRoutes = [
  { path: '/login', element: <Frame><Login /></Frame> },
  { path: '/signup', element: <Frame><Signup /></Frame> },
  // 쇼핑몰 로그인 확인용 임시 주소: http://localhost:3000/shop/login  (이커머스에 붙이면 이 줄은 지워도 돼요)
  { path: '/shop/login', element: <ShopLogin onSuccess={(member) => window.alert(member.name + '님 로그인 성공!')} /> },
];
