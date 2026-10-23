import './junwoo.css';
import Home from './Home';
import Todo from './Todo';
import Todo_set from './Todo_set';
import Todo_detail from './Todo_detail';
import Info from './Info';
import Info_set from './Info_set';
import Info_detail from './Info_detail';
import { JunwooProvider, useJunwoo } from './JunwooContext';

// 준우 담당: 대시보드(메인) / 업무·프로젝트(todo) / 공지사항(info)
// 아래 *Route 컴포넌트는 "상자(Context)에서 데이터를 꺼내 기존 화면에 props 로 넘겨주는" 얇은 연결부예요.
// Home, Todo, Info... 화면 코드는 원래 쓰던 그대로입니다.

function HomeRoute() {
  const { info, todo } = useJunwoo();
  return <Home info={info} todo={todo} />;
}
function TodoRoute() {
  const { todo, delTodo } = useJunwoo();
  return <Todo todo={todo} delTodo={delTodo} />;
}
function TodoSetRoute() {
  const { addTodo } = useJunwoo();
  return <Todo_set onAddTodo={addTodo} />;
}
function TodoDetailRoute() {
  const { todo, viewTodo } = useJunwoo();
  return <Todo_detail todo={todo} onViewTodo={viewTodo} />;
}
function InfoRoute() {
  const { info, delInfo } = useJunwoo();
  return <Info info={info} delInfo={delInfo} />;
}
function InfoSetRoute() {
  const { addInfo } = useJunwoo();
  return <Info_set onAddInfo={addInfo} />;
}
function InfoDetailRoute() {
  const { info, viewInfo } = useJunwoo();
  return <Info_detail info={info} onViewInfo={viewInfo} />;
}

export const Provider = JunwooProvider;

export const shellRoutes = [
  { path: '/', element: <HomeRoute /> },
  { path: '/todo', element: <TodoRoute /> },
  { path: '/todo/set', element: <TodoSetRoute /> },
  { path: '/todo/:id', element: <TodoDetailRoute /> },
  { path: '/info', element: <InfoRoute /> },
  { path: '/info/set', element: <InfoSetRoute /> },
  { path: '/info/:id', element: <InfoDetailRoute /> },
];
