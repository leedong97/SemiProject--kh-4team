import './dong.css';
import Issue from './Issue';
import Issue_detail from './Issue_detail';
import { DongProvider, useDong } from './DongContext';

// 동협 담당: 이슈관리
function IssueRoute() {
  const { projects, issues, setIssues } = useDong();
  return <Issue projects={projects} issues={issues} setIssues={setIssues} />;
}
function IssueDetailRoute() {
  const { projects, issues } = useDong();
  return <Issue_detail projects={projects} issues={issues} />;
}

export const Provider = DongProvider;

export const shellRoutes = [
  { path: '/issue', element: <IssueRoute /> },
  { path: '/issue/:id', element: <IssueDetailRoute /> },
];
