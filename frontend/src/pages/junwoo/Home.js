
import { Link } from 'react-router-dom';
import DashboardCalendar from './DashboardCalendar';

function Home({ info, todo }) {

  // 원본 todo 배열을 바꾸지 않도록 복사한 뒤
  // 프로젝트 번호가 큰 순서로 정렬하여 3개만 표시한다.
  // 생성일 자체를 비교하느 정렬은 아니다.
  const latestTodo = [...todo]
    .sort((a, b) => Number(b.id) - Number(a.id))
    .slice(0, 3);

  return (
    <>

      {/* 캘린더 */}
      <DashboardCalendar />

      {/* 프로젝트 */}
      <div className='todo'>
        <h3 style={{ color: '#0084ff' }}>프로젝트</h3>
        <ol>
          {
            latestTodo.map((item) => (
              <li key={item.id}>
                <Link to={`/todo/${item.id}`}>
                  {item.title}
                </Link>
              </li>
            ))
          }
        </ol>
      </div>

      {/* 공지사항 */}
      <div className='info'>
        <h3 style={{ color: '#0084ff' }}>공지사항</h3>
        <ol>
          {
            // 전달받은 공지사항 배열을 복사하고 순서를 뒤집어 앞의 3개만 표시( 최신순 )
            [...info].reverse().slice(0, 3).map((item) => (
              <li key={item.id}>
                <Link to={`/info/${item.id}`}>
                  {item.title}
                </Link>
              </li>
            ))
          }
        </ol>
      </div>

    </>
  );
}

export default Home;
