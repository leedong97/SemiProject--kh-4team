
import { useState } from 'react';

function Calendar() {

  const [date, setDate] = useState(new Date());

  const year = date.getFullYear();
  const month = date.getMonth();

  // 이번 달 첫 번째 요일
  const firstDay = new Date(year, month, 1).getDay();

  // 이번 달 마지막 날짜
  const lastDate = new Date(year, month + 1, 0).getDate();

  // 날짜 배열 생성
  const days = [];

  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  for (let i = 1; i <= lastDate; i++) {
    days.push(i);
  }

  return (
    <div className="calendar">

      <h3>📅 사내 캘린더</h3>

      <button onClick={() => setDate(new Date(year, month - 1, 1))}>
        이전
      </button>

      <span> {year}년 {month + 1}월 </span>

      <button onClick={() => setDate(new Date(year, month + 1, 1))}>
        다음
      </button>

      <div className="calendar-grid">

        {['일', '월', '화', '수', '목', '금', '토'].map(day => (
          <div className="day-name" key={day}>{day}</div>
        ))}

        {days.map((day, index) => (
          <div className="day" key={index}>
            {day}
          </div>
        ))}

      </div>

    </div>
  );
}

export default Calendar;
