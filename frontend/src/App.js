import { Navigate, useRoutes } from 'react-router-dom';
import TeamShell from './shared/TeamShell';

// ─────────────────────────────────────────────────────────────
//  이 파일은 "참조만" 합니다. 각자 자기 폴더(pages/이름)의 index.js 만 가져와요.
//  새 페이지를 만들 때는 이 파일이 아니라 자기 폴더의 index.js 를 고치세요.
//
//  각 폴더의 index.js 는 아래 3가지를 내보냅니다 (없으면 생략 가능)
//   - Provider         : 그 사람 페이지들이 같이 쓰는 데이터(state)를 담는 상자
//   - shellRoutes      : 위쪽 메뉴바가 있는 화면들 (대시보드, 업무, 이슈, 공지...)
//   - standaloneRoutes : 메뉴바 없이 자기 화면 전체를 쓰는 곳 (로그인, 마이페이지, 관리자)
// ─────────────────────────────────────────────────────────────
import * as woojin from './pages/woojin';
import * as heeseung from './pages/heeseung';
import * as dong from './pages/dong';
import * as junwoo from './pages/junwoo';
import * as jongho from './pages/jongho';

const members = [woojin, heeseung, dong, junwoo, jongho];

function App() {
  const element = useRoutes([
    // 팀 공통 메뉴바가 붙는 화면들
    { element: <TeamShell />, children: members.flatMap((m) => m.shellRoutes || []) },
    // 메뉴바 없이 혼자 쓰는 화면들
    ...members.flatMap((m) => m.standaloneRoutes || []),
    // 없는 주소는 메인으로
    { path: '*', element: <Navigate to="/" replace /> },
  ]);

  // 각 사람의 Provider 를 바깥쪽부터 겹겹이 감싸줘요.
  return members.reduceRight((inner, m) => {
    const Provider = m.Provider;
    return Provider ? <Provider>{inner}</Provider> : inner;
  }, element);
}

export default App;
