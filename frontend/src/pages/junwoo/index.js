import './junwoo.css';
import Home from './Home';
import Todo from './Todo';
import Todo_detail from './Todo_detail';
import Info from './Info';
import Info_set from './Info_set';
import Info_detail from './Info_detail';
import Community from './Community';
import ProjectRequestDetail from "./ProjectRequestDetail";
import { JunwooProvider, useJunwoo } from './JunwooContext';

// 준우 담당: 대시보드(메인) / 업무·프로젝트(todo) / 공지사항(info)
// 아래 *Route 컴포넌트는 "상자(Context)에서 데이터를 꺼내 기존 화면에 props 로 넘겨주는" 얇은 연결부예요.
// Home, Todo, Info... 화면 코드는 원래 쓰던 그대로입니다.

function HomeRoute() {
  const { info, todo } = useJunwoo();
  return <Home info={info} todo={todo} />;
}
function TodoRoute() {
  const { todo } = useJunwoo();
  return <Todo todo={todo} />;
}
function TodoDetailRoute() {
  const { todo, viewTodo, requestProjectCompletion } = useJunwoo();
  return <Todo_detail todo={todo} onViewTodo={viewTodo} onRequestCompletion={requestProjectCompletion} />;
}
function InfoRoute() {
  const { info, delInfo, addInfo } = useJunwoo();
  return <Info info={info} onAddInfo={addInfo} />;
}
function InfoSetRoute() {
  const { info, addInfo } = useJunwoo();
  return <Info_set info={info} onAddInfo={addInfo} />;
}
function InfoDetailRoute() {
  const { info, viewInfo } = useJunwoo();
  return <Info_detail info={info} onViewInfo={viewInfo} />;
}

export const Provider = JunwooProvider;

export const shellRoutes = [
  { path: '/', element: <HomeRoute /> },
  { path: '/todo', element: <TodoRoute /> },
  { path: '/todo/:id', element: <TodoDetailRoute /> },
  { path: '/info', element: <InfoRoute /> },
  { path: '/info/set', element: <InfoSetRoute /> },
  { path: '/info/:id', element: <InfoDetailRoute /> },
  { path: "/project-requests/:id", element: <ProjectRequestDetail /> },
];

export const standaloneRoutes = [
  {
    path: "/community",
    element: <Community />
  },
  {
    path: "/community/board",
    element: <Community menu="게시판" />
  },
  {
    path: "/community/board/:boardCode",
    element: <Community menu="게시판" />
  },
  {
    path: "/community/activity",
    element: <Community menu="내 활동" activity="내가 작성한 글" />
  },
  {
    path: "/community/activity/comments",
    element: <Community menu="내 활동" activity="내가 작성한 댓글" />
  },
  {
    path: "/community/activity/bookmarks",
    element: <Community menu="내 활동" activity="저장한 글" />
  },
  {
    path: "/community/post/:postId",
    element: <Community menu="게시판" screen="detail" />
  },
  {
    path: "/community/write/:boardCode",
    element: <Community menu="게시판" screen="form" />
  },
  {
    path: "/community/edit/:postId",
    element: <Community menu="게시판" screen="form" />
  }
];
