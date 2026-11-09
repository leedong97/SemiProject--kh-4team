import './dong.css';
import Issue from './Issue';
import Issue_detail from './Issue_detail';
import IssueRequest from './Issue_request';
import IssueCompletion from './IssueCompletion';
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
function IssueRequestRoute() {
  const { setIssues } = useDong();
  return <IssueRequest setIssues={setIssues} />;
}

export const Provider = DongProvider;

export const shellRoutes = [
  { path: '/issue', element: <IssueRoute /> },
  { path: '/issue/request', element: <IssueRequestRoute /> },
  { path: '/issue/completion-request', element: <IssueCompletion /> },
  { path: '/issue/:id', element: <IssueDetailRoute /> },
];