import React, { useState } from 'react';

// 일정 종류 → 점 색 이름 (기존 방식 그대로: 날짜 아래 종류별 점)
export const SCHEDULE_TYPES = [
  { type: '업무', key: 'work' },
  { type: '개인', key: 'personal' },
  { type: '휴가', key: 'leave' },
  { type: '프로젝트', key: 'project' },
  { type: '공지사항', key: 'notice', label: '공지' },
];

const typeKey = (type) => SCHEDULE_TYPES.find((t) => t.type === type)?.key || 'other';

export function toISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const WEEK = ['일', '월', '화', '수', '목', '금', '토'];

// selectedDate / onSelect 는 대시보드(Home)가 가지고 있어요.
// 날짜를 누르면 왼쪽 일정 목록이 그 날짜로 바뀌어요.
function Calendar({ schedules = [], selectedDate, onSelect, loading }) {
  const today = toISO(new Date());
  const initial = selectedDate ? new Date(`${selectedDate}T00:00:00`) : new Date();
  const [month, setMonth] = useState(new Date(initial.getFullYear(), initial.getMonth(), 1));

  const year = month.getFullYear();
  const monthIndex = month.getMonth();

  // 1일의 요일(일요일 0)만큼 앞을 비우고, 마지막 주는 다음 달 날짜로 채워요.
  const firstDay = new Date(year, monthIndex, 1).getDay();
  const lastDate = new Date(year, monthIndex + 1, 0).getDate();
  const prevLast = new Date(year, monthIndex, 0).getDate();
  const totalCells = Math.ceil((firstDay + lastDate) / 7) * 7;

  const cells = Array.from({ length: totalCells }, (_, i) => {
    const offset = i - firstDay + 1;
    if (offset < 1) return { day: prevLast + offset, outside: true, date: toISO(new Date(year, monthIndex - 1, prevLast + offset)) };
    if (offset > lastDate) return { day: offset - lastDate, outside: true, date: toISO(new Date(year, monthIndex + 1, offset - lastDate)) };
    return { day: offset, outside: false, date: toISO(new Date(year, monthIndex, offset)) };
  });

  // 날짜별 일정 종류(점)와 개수
  const byDate = {};
  schedules.forEach((item) => {
    const entry = byDate[item.date] || (byDate[item.date] = { types: [], count: 0 });
    entry.count += 1;
    const t = item.type || '기타';
    if (!entry.types.includes(t)) entry.types.push(t);
  });

  const changeMonth = (num) => setMonth(new Date(year, monthIndex + num, 1));

  const goToToday = () => {
    const now = new Date();
    setMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    onSelect(toISO(now));
  };

  const pick = (cell) => {
    if (cell.outside) {
      const d = new Date(`${cell.date}T00:00:00`);
      setMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    }
    onSelect(cell.date);
  };

  return (
    <section className="cmd-panel cmd-cal" aria-labelledby="cmd-cal-title">
      <header className="cmd-panel-head">
        <h2 id="cmd-cal-title">
          {year}년 {monthIndex + 1}월
        </h2>
        <div className="cmd-cal-nav">
          <button type="button" className="cmd-icon-btn" aria-label="이전 달" onClick={() => changeMonth(-1)}>
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M9 2.5 4.5 7 9 11.5" fill="none" stroke="currentColor" strokeWidth="1.8" /></svg>
          </button>
          <button type="button" className="cmd-text-btn" onClick={goToToday}>
            오늘
          </button>
          <button type="button" className="cmd-icon-btn" aria-label="다음 달" onClick={() => changeMonth(1)}>
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M5 2.5 9.5 7 5 11.5" fill="none" stroke="currentColor" strokeWidth="1.8" /></svg>
          </button>
        </div>
      </header>

      <div className="cmd-cal-grid" role="grid" aria-busy={loading || undefined}>
        <div className="cmd-cal-row" role="row">
          {WEEK.map((d, i) => (
            <span key={d} role="columnheader" className={`cmd-cal-wd${i === 0 ? ' is-sun' : ''}${i === 6 ? ' is-sat' : ''}`}>
              {d}
            </span>
          ))}
        </div>

        {Array.from({ length: totalCells / 7 }, (_, w) => (
          <div className="cmd-cal-row" role="row" key={w}>
            {cells.slice(w * 7, w * 7 + 7).map((cell, i) => {
              const info = byDate[cell.date];
              const isToday = cell.date === today;
              const isSelected = cell.date === selectedDate;
              const [, m, d] = cell.date.split('-');
              const label = `${Number(m)}월 ${Number(d)}일${isToday ? ' 오늘' : ''}, ${info ? `일정 ${info.count}건 (${info.types.join(', ')})` : '일정 없음'}`;

              return (
                <div role="gridcell" key={cell.date} className="cmd-cal-cell">
                  <button
                    type="button"
                    className={[
                      'cmd-cal-day',
                      cell.outside && 'is-outside',
                      isToday && 'is-today',
                      isSelected && 'is-selected',
                      i === 0 && 'is-sun',
                      i === 6 && 'is-sat',
                    ].filter(Boolean).join(' ')}
                    aria-label={label}
                    aria-pressed={isSelected}
                    onClick={() => pick(cell)}
                  >
                    <span className="cmd-cal-num cmd-num">{cell.day}</span>
                    <span className="cmd-cal-dots" aria-hidden="true">
                      {info?.types.slice(0, 4).map((t) => (
                        <i key={t} className={`cmd-dot cmd-dot--${typeKey(t)}`} />
                      ))}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <ul className="cmd-legend" aria-label="일정 종류">
        {SCHEDULE_TYPES.map((t) => (
          <li key={t.key}>
            <i className={`cmd-dot cmd-dot--${t.key}`} aria-hidden="true" />
            {t.label || t.type}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default Calendar;
