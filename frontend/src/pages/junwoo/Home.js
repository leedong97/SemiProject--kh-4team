
import { Link } from 'react-router-dom';
import DashboardCalendar from './DashboardCalendar';

function Home({ info, todo }) {

  return (

    <>

      {/* 캘린더 */}
      <DashboardCalendar />

      {/* 프로젝트 */}
      <div className='todo'>
        <h3>프로젝트</h3>
        <ol>
          {
            [...todo].reverse().slice(0, 3).map((item) => (
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
        <h3>공지사항</h3>
        <ol>
          {
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
