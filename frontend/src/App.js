
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
