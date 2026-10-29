import { Navigate } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import './styles/jongho.css';
import AdminLayout from './components/AdminLayout';
import Dashboard from './pages/Dashboard';
import ProjectManagement from './pages/ProjectManagement';
import ManagerAssignment from './pages/ManagerAssignment';
import Notices from './pages/Notices';
import AdminAudit from './pages/AdminAudit';
import Workload from './pages/Workload';
import IssueManagement from '../heeseung/components/IssueManagement';
import HRManagement from '../heeseung/components/HRManagement';
import EmployeeEvaluation from '../heeseung/components/EmployeeEvaluation';
import { JonghoProvider, useJongho } from './JonghoContext';

// 종호 담당: 관리자 페이지(/admin/...)
// 로컬 개발용: 로그인 검사 없이 바로 관리자 화면을 보여줍니다.
// 프론트에서 로그인 상태를 확인하며, 실제 API 권한은 백엔드에서 다시 검사합니다.

function AdminRoute() {
  const navigate = useNavigate();
  return <AdminLayout onLogout={() => { sessionStorage.removeItem('nexus_token'); sessionStorage.removeItem('nexus_role'); navigate('/login'); }} />;
}
function DashboardRoute() {
  const { projects, data } = useJongho();
  return <Dashboard projects={projects} data={data} />;
}
function ProjectsRoute() {
  const { projects, setProjects, data, createProject, updateProject, removeProject } = useJongho();
  return (
    <ProjectManagement
      projects={projects}
      setProjects={setProjects}
      createProject={createProject}
      updateProject={updateProject}
      removeProject={removeProject}
      employees={data.employees}
    />
  );
}
function AssignmentsRoute() {
  const { projects, setProjects, data, createProject, updateProject, removeProject } = useJongho();
  return (
    <ManagerAssignment
      projects={projects}
      setProjects={setProjects}
      updateProject={updateProject}
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
      <h2>브라우저 연습 데이터 관리</h2><p>DB 데이터는 삭제되지 않습니다. 인사·이슈·평가의 화면 변경은 현재 DB 저장이 연결되지 않았습니다.</p>
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
      { path: 'boards',element: <Notices />,},
      { path: 'settings', element: <SettingsRoute /> },
      { path: 'audit', element: <AdminAudit /> },
      { path: 'workload', element: <Workload /> },
    ],
  },
];