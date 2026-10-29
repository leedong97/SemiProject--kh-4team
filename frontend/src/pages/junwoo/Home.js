import { Link } from 'react-router-dom';
import Calendar from './Calendar';

function Home({ info, todo }) {

  return (

    <>

      <Calendar />

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

      <div className='info'>
        <h3>공지사항</h3>
        <ol>
          {
            [...info].slice(0, 3).map((item) => (
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
