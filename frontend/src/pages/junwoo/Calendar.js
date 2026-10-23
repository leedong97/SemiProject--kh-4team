import React, { useState } from "react";

function Calendar({ schedules = [] }) {

  const [month, setMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState('');

  const year = month.getFullYear();
  const monthNumber = month.getMonth() + 1;

  // 이번 달 1일의 요일
  const firstDay = new Date(year, monthNumber - 1, 1).getDay();

  // 이번 달 마지막 날짜
  const lastDate = new Date(year, monthNumber, 0).getDate();

  const emptyDays = Array.from({ length: firstDay });

  const days = Array.from(
    { length: lastDate },
    (_, i) => i + 1
  );

  // 이전 달 / 다음 달
  const changeMonth = (num) => {

    setMonth(new Date(year, monthNumber - 1 + num, 1));
    setSelectedDate('');
  };

  // 선택한 날짜의 일정 가져오기
  const selectedSchedules = schedules.filter(item =>
    item.date === selectedDate
  ).sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="calendar-area">

      <div className="calendar">

        <div className="calendar-top">

          <button onClick={() => changeMonth(-1)}>
            이전
          </button>

          <h2>{year}년 {monthNumber}월</h2>

          <button onClick={() => changeMonth(1)}>
            다음
          </button>

        </div>

        <div className="calendar-grid">

          {['일', '월', '화', '수', '목', '금', '토'].map(day => (
            <div key={day} className="day-name">
              {day}
            </div>
          ))}

          {emptyDays.map((_, index) => (
            <div key={`empty-${index}`} />
          ))}

          {days.map(day => {

            const date =
              `${year}-${String(monthNumber).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

            // 해당 날짜에 일정이 있는지 확인
            const hasSchedule = schedules.some(item =>
              item.date === date
            );

            return (
              <button
                key={day}
                type="button"
                className={
                  selectedDate === date
                    ? 'day selected'
                    : 'day'
                }
                onClick={() => setSelectedDate(date)}
              >
                {day}

                {hasSchedule && (
                  <span className="schedule-dot"></span>
                )}

              </button>
            );
          })}

        </div>

      </div>

      {/* 선택한 날짜의 일정 */}
      <div className="calendar-schedule">

        <h3>
          {selectedDate ? `${selectedDate} 일정` : '선택한 날짜의 일정'}
        </h3>

        {!selectedDate ? (

          <p>날짜를 선택해 주세요.</p>

        ) : (

          <>

            {selectedSchedules.length === 0 ? (

              <p>등록된 일정이 없습니다.</p>

            ) : (

              <ul>
                {selectedSchedules.map(item => (

                  <li key={item.id}>

                    <strong>{item.time}</strong>

                    <span>{item.title}</span>

                  </li>

                ))}
              </ul>

            )}

          </>

        )}

      </div>

    </div>
  );
}

export default Calendar;