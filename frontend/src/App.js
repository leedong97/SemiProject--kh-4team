
import { Navigate, useRoutes, useLocation } from 'react-router-dom';
import TeamShell from './shared/TeamShell';

// 기존 팀원 페이지
import * as woojin from './pages/woojin';
import * as heeseung from './pages/heeseung';
import * as dong from './pages/dong';
import * as junwoo from './pages/junwoo';
import * as jongho from './pages/jongho';

// 고객용 데모 페이지
import { previewRoutes } from './pages/preview';

// 이커머스 맛보기
import PricingPage from "./pages/pricing/PricingPage";

// 로그인 여부 확인 (localStorage 에 직원 정보가 없으면 isDummy: true)
import getLoginUser from './pages/woojin/getLoginUser';

// true  = 로그인해야 메인으로 갈 수 있어요 (발표 때)
// false = 예전처럼 로그인 없이 더미 데이터로 바로 열려요 (개발 중 빠른 확인용)
const REQUIRE_LOGIN = true;

// 로그인 없이 들어갈 수 있는 주소 (로그인 페이지 자체, 회원가입, 고객용 데모, 요금제, 쇼핑몰 임시 로그인)
const PUBLIC_PATHS = ['/login', '/signup', '/preview', '/pricing', '/shop/login'];

const members = [woojin, heeseung, dong, junwoo, jongho];

function App() {

  const location = useLocation();

  const element = useRoutes([



    // 1. 고객 확인용 데모 화면
    ...previewRoutes,

    // 이커머스 요금제 페이지
    {
      path: '/pricing',
      element: <PricingPage />
    },

    // 2. 기존 ERP 공통 메뉴 화면
    {
      element: <TeamShell />,
      children: members.flatMap(m => m.shellRoutes || [])
    },

    // 3. 기존 팀원별 독립 페이지
    ...members.flatMap(m => m.standaloneRoutes || []),

    // 4. 잘못된 주소는 메인으로
    {
      path: '*',
      element: <Navigate to="/" replace />
    }

  ]);

  // 로그인 안 했으면 로그인 페이지로 보냄 (공개 주소는 제외)
  const isPublic = PUBLIC_PATHS.some(
    p => location.pathname === p || location.pathname.startsWith(p + '/')
  );
  const loginUser = getLoginUser();
  if (REQUIRE_LOGIN && !isPublic && loginUser.isDummy) {
    return <Navigate to="/login" replace />;
  }

  // 관리자 화면(/admin)은 관리자 계정만 들어갈 수 있어요. 일반 사원이 주소를 직접 쳐도 메인으로 돌려보내요.
  const isAdminPath = location.pathname === '/admin' || location.pathname.startsWith('/admin/');
  if (REQUIRE_LOGIN && isAdminPath && loginUser.role !== '관리자') {
    return <Navigate to="/" replace />;
  }

  // 고객용 데모는 DB Provider 없이 실행
  if (
    location.pathname === '/preview' ||
    location.pathname.startsWith('/preview/')
  ) {
    return element;
  }

  if (
    location.pathname === '/preview' ||
    location.pathname.startsWith('/preview/') ||
    location.pathname === '/pricing' ||
    location.pathname.startsWith('/pricing/')
  ) {
    return element;
  }

  // 기존 ERP는 Provider 그대로 유지
  return members.reduceRight((inner, m) => {
    const Provider = m.Provider;

    return Provider
      ? <Provider>{inner}</Provider>
      : inner;

  }, element);
}

export default App;
