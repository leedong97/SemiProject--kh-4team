
import { Link } from 'react-router-dom';
import DashboardCalendar from './DashboardCalendar';

function Home({ info, todo }) {

  // 원본 todo 배열을 바꾸지 않도록 복사한 뒤
  // 프로젝트 번호가 큰 순서로 정렬하여 3개만 표시한다.
  // 생성일 자체를 비교하느 정렬은 아니다.
  const latestTodo = [...todo]
    .sort((a, b) => Number(b.id) - Number(a.id))
    .slice(0, 3);

  // 고정 공지 우선으로 정렬한 뒤 최대 3개 표시
  const latestInfo = [...info]
    .sort((a, b) => {
      const aPinned = Number(a.isPinned) === 1;
      const bPinned = Number(b.isPinned) === 1;

      if (aPinned !== bPinned) {
        return aPinned ? -1 : 1;
      }

      return Number(b.id) - Number(a.id);
    })
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
          {latestInfo.map((item) => (
            <li
              key={item.id}
              style={
                Number(item.isPinned) === 1
                  ? { listStyleType: "none" }
                  : undefined
              }
            >
              <Link to={`/info/${item.id}`}>
                {Number(item.isPinned) === 1 && (
                  <strong style={{ color: "#d32f2f", marginRight: "6px" }}>
                    [중요]
                  </strong>
                )}
                {item.title}
              </Link>
            </li>
          ))}
        </ol>
      </div>

    </>
  );
}

export default Home;
