import { Navigate, useNavigate } from 'react-router-dom';
import './styles/jongho.css';
import './styles/admin-unified.css';
import AdminLayout from './components/AdminLayout';
import Dashboard from './pages/Dashboard';
import ProjectManagement from './pages/ProjectManagement';
import MemberManagement from './pages/MemberManagement';
import Notices from './pages/Notices';
import Community from './pages/Community';
import Workload from './pages/Workload';
import IssueManagement from '../heeseung/components/IssueManagement';
import HRManagement from '../heeseung/components/HRManagement';
import EmployeeEvaluation from '../heeseung/components/EmployeeEvaluation';
import { JonghoProvider, useJongho } from './JonghoContext';
import getLoginUser, { clearLoginUser } from "../woojin/getLoginUser";

// 종호 담당: 관리자 페이지(/admin/...)
// 로그인한 관리자만 들어올 수 있고, 아니면 로그인 화면으로 보냅니다.
// 실제 데이터 권한은 백엔드(/api/admin)에서 토큰으로 다시 검사합니다.

function AdminRoute() {
  const navigate = useNavigate();
  const me = getLoginUser();

  if (me.isDummy || me.role !== '관리자') {
    return <Navigate to="/login" replace />;
  }

  return (
    <AdminLayout
      onLogout={() => {
        clearLoginUser();
        sessionStorage.removeItem("nexus_token");
        sessionStorage.removeItem("nexus_role");
        navigate("/login");
      }}
    />
  );
}
function DashboardRoute() {
  const { projects, data } = useJongho();
  return <Dashboard projects={projects} data={data} />;
}
function ProjectsRoute() {
  const { projects, setProjects, resetProjects, data, createProject, updateProject, removeProject } = useJongho();
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
function MembersRoute() {
  const { projects, data, updateProject, updateProjectMembers } = useJongho();
  return (
    <MemberManagement
      projects={projects}
      updateProject={updateProject}
      updateProjectMembers={updateProjectMembers}
      employees={data.employees.map((e) => ({ ...e, role: e.role || e.position }))}
    />
  );
}
function IssuesRoute() {
  const { data, changeData, projects } = useJongho();
  return (
    <div className="merge-erp-module">
      <IssueManagement data={{ ...data, projects: projects || [] }} changeData={changeData} />
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
export const Provider = JonghoProvider;

export const standaloneRoutes = [
  {
    path: '/admin',
    element: <AdminRoute />,
    children: [
      { index: true, element: <DashboardRoute /> },
      { path: 'projects', element: <ProjectsRoute /> },
      { path: 'members', element: <MembersRoute /> },
      { path: 'issues', element: <IssuesRoute /> },
      { path: 'employees', element: <EmployeesRoute /> },
      { path: 'evaluations', element: <EvaluationsRoute /> },
      { path: 'boards', element: <Notices />, },
      { path: 'community', element: <Community /> },
      { path: 'workload', element: <Workload /> },
    ],
  },
];