import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const scheduleTypeClasses = {
  업무: "work",
  개인: "personal",
  휴가: "leave",
  프로젝트: "project",
  공지사항: "notice"
};

function Calendar({ schedules = [] }) {

  const navigate = useNavigate();

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

    // 오늘이 있는 달로 이동하고 오늘 날짜 선택
    const goToToday = () => {
      const now = new Date();

      setMonth(new Date(now.getFullYear(), now.getMonth(), 1));

      setSelectedDate(
        `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
      );
    };

    setMonth(new Date(year, monthNumber - 1 + num, 1));
    setSelectedDate('');
  };

  const goToToday = () => {
    const now = new Date();

    setMonth(new Date(now.getFullYear(), now.getMonth(), 1));

    setSelectedDate(
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
    );
  };

  // 선택한 날짜의 일정 가져오기
  const selectedSchedules = schedules
    .filter(item => item.date === selectedDate)
    .sort((a, b) => (a.time || "").localeCompare(b.time || ""));

  console.log("선택한 날짜:", selectedDate);
  console.log("해당 날짜의 일정:", selectedSchedules);
  console.log(
    "받아온 공지사항:",
    schedules.filter(item =>
      item.title.includes("[공지사항]")
    )
  );

  return (
    <div className="calendar-area">

      <div className="calendar">

        <div className="calendar-top">
          <div className="calendar-month-nav">
            <button
              type="button"
              aria-label="이전 달"
              onClick={() => changeMonth(-1)}
            >
              ‹
            </button>

            <h2>{year}년 {monthNumber}월</h2>

            <button
              type="button"
              aria-label="다음 달"
              onClick={() => changeMonth(1)}
            >
              ›
            </button>
          </div>

          <button
            type="button"
            className="calendar-today-btn"
            onClick={goToToday}
          >
            오늘
          </button>
        </div>


        {/* 일정 종류별 색상 안내 */}
        <div className="calendar-legend">

          <span>
            <i className="legend-dot legend-dot--work"></i>
            업무
          </span>

          <span>
            <i className="legend-dot legend-dot--personal"></i>
            개인
          </span>

          <span>
            <i className="legend-dot legend-dot--leave"></i>
            휴가
          </span>

          <span>
            <i className="legend-dot legend-dot--project"></i>
            프로젝트
          </span>

          <span>
            <i className="legend-dot legend-dot--notice"></i>
            공지사항
          </span>

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

            // 해당 날짜에 등록된 일정 종류 가져오기
            const scheduleTypes = [
              ...new Set(
                schedules
                  .filter(item => item.date === date)
                  .map(item => item.type || "기타")
              )
            ];

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


                {/* 일정 종류별 색상 점 표시 */}
                {scheduleTypes.length > 0 && (

                  <span className="schedule-dots">

                    {scheduleTypes.map(type => (

                      <span
                        key={type}
                        className={`schedule-dot schedule-dot--${scheduleTypeClasses[type] || "other"}`}
                        title={type}
                      ></span>

                    ))}

                  </span>

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

                    <strong>{item.time || "종일"}</strong>


                    <span>

                      {item.type === "프로젝트" && item.projectId != null ? (

                        <button
                          type="button"
                          className="calendar-project-link"
                          onClick={() => navigate(`/todo/${item.projectId}`)}
                        >
                          {item.title}
                        </button>

                      ) : item.type === "공지사항" && item.noticeId != null ? (

                        <button
                          type="button"
                          className="calendar-notice-link"
                          onClick={() => navigate(`/info/${item.noticeId}`)}
                        >
                          {item.title}
                        </button>

                      ) : (

                        item.title

                      )}

                    </span>


                  </li>


                ))}
              </ul>

            )}

          </>

        )}

        {/* 캘린더에서 프로젝트 등록 */}

        {selectedDate && (
          <div className="calendar-register-actions">

            {/* 프로젝트 등록 */}
            <button
              type="button"
              className="calendar-add-project-btn"
              onClick={() => navigate("/todo", {
                state: {
                  startDate: selectedDate
                }
              })}
            >
              + 프로젝트 등록 요청
            </button>

          </div>
        )}


      </div>

    </div>
  );
}

export default Calendar;