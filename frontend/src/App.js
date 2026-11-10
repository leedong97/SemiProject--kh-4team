
import { Navigate, useRoutes, useLocation } from 'react-router-dom';
import TeamShell from './shared/TeamShell';
import PricingPage from './pages/pricing/PricingPage';

// 기존 팀원 페이지
import * as woojin from './pages/woojin';
import * as heeseung from './pages/heeseung';
import * as dong from './pages/dong';
import * as junwoo from './pages/junwoo';
import * as jongho from './pages/jongho';

const members = [woojin, heeseung, dong, junwoo, jongho];

function App() {

  const location = useLocation();

  const element = useRoutes([

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

  // 요금제 화면은 ERP 데이터 Provider 없이 표시
  if (
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
