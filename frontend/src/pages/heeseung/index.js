import './erp.css';
// 희승 폴더 (아직 비어 있어요)
// 여기에 자기 페이지를 만들고, 아래 둘 중 필요한 것을 채우면 App.js 는 안 고쳐도 돼요.
//  - shellRoutes      : 위쪽 메뉴바가 있는 화면  예) { path: '/something', element: <Something /> }
//  - standaloneRoutes : 메뉴바 없는 독립 화면
export const shellRoutes = [];
export const standaloneRoutes = [];

// 종호 관리자 화면(/admin/...)에서 쓰는 컴포넌트. 희승 폴더로 이관.
export { default as IssueManagement } from './components/IssueManagement';
export { default as HRManagement } from './components/HRManagement';
export { default as EmployeeEvaluation } from './components/EmployeeEvaluation';
