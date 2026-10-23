import { useNavigate } from 'react-router-dom';
import './styles/jongho.css';
import AdminLayout from './components/AdminLayout';
import Dashboard from './pages/Dashboard';
import ProjectManagement from './pages/ProjectManagement';
import ManagerAssignment from './pages/ManagerAssignment';
import IssueManagement from '../heeseung/components/IssueManagement';
import HRManagement from '../heeseung/components/HRManagement';
import EmployeeEvaluation from '../heeseung/components/EmployeeEvaluation';
import { JonghoProvider, useJongho } from './JonghoContext';

// 종호 담당: 관리자 페이지(/admin/...)
// 관리자 로그인은 우진의 로그인 페이지(/login)를 같이 쓰도록 정리했어요.
// (지금은 로그인 검사 없이 /admin 에 바로 들어갈 수 있어요. 서버 연결 후 보호 예정)

function AdminRoute() {
  const navigate = useNavigate();
  return <AdminLayout onLogout={() => navigate('/login')} />;
}
function DashboardRoute() {
  const { projects, data } = useJongho();
  return <Dashboard projects={projects} data={data} />;
}
function ProjectsRoute() {
  const { projects, setProjects } = useJongho();
  return <ProjectManagement projects={projects} setProjects={setProjects} />;
}
function AssignmentsRoute() {
  const { projects, setProjects, data } = useJongho();
  return (
    <ManagerAssignment
      projects={projects}
      setProjects={setProjects}
      employees={data.employees.map((e) => ({ ...e, role: e.role || e.position }))}
    />
  );
}
function IssuesRoute() {
  const { data, changeData } = useJongho();
  return (
    <div className="merge-erp-module">
      <IssueManagement data={data} changeData={changeData} />
    </div>
  );
}
function EmployeesRoute() {
  const { data, changeData } = useJongho();
  return (
    <div className="merge-erp-module">
      <HRManagement data={data} changeData={changeData} />
    </div>
  );
}
function EvaluationsRoute() {
  const { data, changeData } = useJongho();
  return (
    <div className="merge-erp-module">
      <EmployeeEvaluation data={data} changeData={changeData} />
    </div>
  );
}
function SettingsRoute() {
  const { resetDemo } = useJongho();
  return (
    <div className="merge-placeholder">
      <h2>연습 데이터 관리</h2>
      <button className="btn btn-outline" onClick={resetDemo}>샘플 데이터 초기화</button>
    </div>
  );
}

export const Provider = JonghoProvider;

export const standaloneRoutes = [
  {
    path: '/admin',
    element: <AdminRoute />,
    children: [
      { index: true, element: <DashboardRoute /> },
      { path: 'projects', element: <ProjectsRoute /> },
      { path: 'assignments', element: <AssignmentsRoute /> },
      { path: 'issues', element: <IssuesRoute /> },
      { path: 'employees', element: <EmployeesRoute /> },
      { path: 'evaluations', element: <EvaluationsRoute /> },
      {
        path: 'boards',
        element: (
          <div className="merge-placeholder">
            <h2>공지 관리</h2>
            <p>이 메뉴는 기존 프로젝트의 확장 공간으로 남겨두었습니다.</p>
          </div>
        ),
      },
      { path: 'settings', element: <SettingsRoute /> },
    ],
  },
];
