import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE } from '../../shared/config';
import { statusLamp, StationStrip } from '../../shared/subway';
import { Priority } from '../../shared/priority';
import getLoginUser from '../woojin/getLoginUser';
import Calendar, { SCHEDULE_TYPES, toISO } from './Calendar';
import { useDashboardSchedules } from './DashboardCalendar';
import './Dashboard.css';

const WEEK = ['일', '월', '화', '수', '목', '금', '토'];
const OPEN_ISSUE_STATES = ['접수', '검토 중', '진행 중', '재오픈'];
const ISSUE_TONE = { 접수: 'sky', '검토 중': 'purple', '진행 중': 'green', 재오픈: 'red' };
const SOON_MIN = 60; // 이 시간(분) 안에 시작하면 "곧 출발"

const typeKey = (type) => SCHEDULE_TYPES.find((t) => t.type === type)?.key || 'other';

export function parseDate(value) {
  if (!value) return null;
  const m = String(value).match(/(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

export function dDay(endDate) {
  const end = parseDate(endDate);
  if (!end) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((end - today) / 86400000);
}

function dDayText(n) {
  if (n === null) return '–';
  if (n === 0) return 'D-DAY';
  return n > 0 ? `D-${n}` : `D+${-n}`;
}

function dateTitle(iso) {
  const d = new Date(`${iso}T00:00:00`);
  return { md: `${d.getMonth() + 1}월 ${d.getDate()}일`, wd: `${WEEK[d.getDay()]}요일` };
}

function toMin(hhmm) {
  const m = String(hhmm || '').match(/(\d{1,2}):(\d{2})/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

function useNowMin() {
  const get = () => {
    const n = new Date();
    return n.getHours() * 60 + n.getMinutes();
  };
  const [now, setNow] = useState(get);
  useEffect(() => {
    const id = setInterval(() => setNow(get()), 30000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function hhmm(min) {
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
}

function afterText(diff) {
  if (diff <= 0) return '지금';
  if (diff < 60) return `${diff}분 후`;
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return m ? `${h}시간 ${m}분 후` : `${h}시간 후`;
}

// 내 이슈: 이슈관리(동협) API에서 내가 건의했거나 담당인 이슈만 골라요.
function useMyIssues(user) {
  const [state, setState] = useState({ issues: [], loading: true, error: '' });

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_BASE}/api/dong/issues`, { signal: controller.signal, cache: 'no-store' })
      .then((r) => {
        if (!r.ok) throw new Error('이슈를 불러오지 못했어요.');
        return r.json();
      })
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        const mine = list.filter(
          (i) => Number(i.reporterId) === Number(user.id) || (i.assigneeName && i.assigneeName === user.name)
        );
        setState({ issues: mine, loading: false, error: '' });
      })
      .catch((e) => {
        if (e.name !== 'AbortError') setState({ issues: [], loading: false, error: e.message });
      });
    return () => controller.abort();
  }, [user.id, user.name]);

  return state;
}

/* ---------------- 오늘 출발 (어두운 안내판) ---------------- */

function DepartureBoard({ date, schedules, loading, error, onRetry }) {
  const navigate = useNavigate();
  const nowMin = useNowMin();
  const isToday = date === toISO(new Date());
  const { md, wd } = dateTitle(date);

  const rows = schedules
    .filter((s) => s.date === date)
    .map((s) => {
      const t = toMin(s.time);
      let state = 'plan';
      if (isToday && t !== null) {
        if (t < nowMin) state = 'done';
        else if (t - nowMin <= SOON_MIN) state = 'soon';
      }
      if (t === null) state = 'allday';
      return { ...s, t, state };
    })
    .sort((a, b) => {
      // 오늘이면 남은 일정 먼저, 지난 일정은 아래로
      const ad = a.state === 'done' ? 1 : 0;
      const bd = b.state === 'done' ? 1 : 0;
      if (ad !== bd) return ad - bd;
      return (a.t ?? -1) - (b.t ?? -1);
    });

  const next = isToday ? rows.find((r) => r.t !== null && r.state !== 'done') : null;
  const rest = rows.filter((r) => r !== next);

  const open = (s) => {
    if (s.type === '프로젝트' && s.projectId != null) navigate(`/todo/${s.projectId}`);
    else if (s.type === '공지사항' && s.noticeId != null) navigate(`/info/${s.noticeId}`);
  };
  const clickable = (s) => (s.type === '프로젝트' && s.projectId != null) || (s.type === '공지사항' && s.noticeId != null);

  const lamp = (r) => {
    if (r.state === 'done') return <span className="dep-lamp dep-lamp--done">지남</span>;
    if (r.state === 'soon') return <span className="dep-lamp dep-lamp--soon">곧 시작</span>;
    if (r.state === 'allday') return <span className="dep-lamp dep-lamp--plan">종일</span>;
    return <span className="dep-lamp dep-lamp--ok">예정</span>;
  };

  return (
    <section className="dep-board" aria-labelledby="dep-title" aria-live="polite">
      <header className="dep-head">
        <h2 id="dep-title">
          {isToday ? '오늘 일정' : `${md} 일정`}
        </h2>
        {isToday ? (
          <span className="dep-clock cmd-num" aria-label={`현재 시각 ${hhmm(nowMin)}`}>{hhmm(nowMin)}</span>
        ) : (
          <span className="dep-clock is-other">{wd}</span>
        )}
      </header>

      {loading ? (
        <div className="dep-msg" aria-label="일정을 불러오는 중">
          <span className="dep-skel" /><span className="dep-skel" style={{ width: '60%' }} /><span className="dep-skel" style={{ width: '40%' }} />
        </div>
      ) : error ? (
        <div className="dep-msg dep-msg--error" role="alert">
          <p>{error.message || String(error)}</p>
          <div className="dep-actions">
            <button type="button" onClick={onRetry}>다시 시도</button>
            {error.needsLogin && <Link to="/login">로그인하기</Link>}
          </div>
        </div>
      ) : rows.length === 0 ? (
        <div className="dep-msg">
          <p className="dep-msg-title">{isToday ? '오늘 일정이 없어요' : '이 날은 일정이 없어요'}</p>
        </div>
      ) : (
        <>
          {next && (
            <div className={`dep-next${clickable(next) ? ' is-link' : ''}`}>
              <span className="dep-next-time cmd-num">{next.time}</span>
              <div className="dep-next-body">
                <p className="dep-next-title">
                  {clickable(next) ? (
                    <button type="button" onClick={() => open(next)}>{next.title}</button>
                  ) : next.title}
                </p>
                <p className="dep-next-meta">
                  <i className={`cmd-dot cmd-dot--${typeKey(next.type)}`} aria-hidden="true" />
                  {next.type || '기타'}
                </p>
              </div>
              <div className="dep-next-status">
                {lamp(next)}
                <span className="dep-next-after cmd-num">{afterText(next.t - nowMin)}</span>
              </div>
            </div>
          )}

          {rest.length > 0 && (
            <table className="dep-table">
              <caption className="cmd-sr">{isToday ? '오늘' : md} 일정</caption>
              <thead>
                <tr>
                  <th scope="col">시각</th>
                  <th scope="col">구분</th>
                  <th scope="col">일정</th>
                  <th scope="col">상태</th>
                </tr>
              </thead>
              <tbody>
                {rest.map((r) => (
                  <tr key={r.key} className={r.state === 'done' ? 'is-done' : undefined}>
                    <td className="dep-time cmd-num">{r.time || '종일'}</td>
                    <td className="dep-type">
                      <i className={`cmd-dot cmd-dot--${typeKey(r.type)}`} aria-hidden="true" />
                      {r.type || '기타'}
                    </td>
                    <td className="dep-dest">
                      {clickable(r) ? <button type="button" onClick={() => open(r)}>{r.title}</button> : r.title}
                    </td>
                    <td>{lamp(r)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </section>
  );
}

/* ---------------- 내 프로젝트 코드표 ---------------- */

function ProjectTable({ projects, title }) {
  const navigate = useNavigate();
  return (
    <section className="cmd-panel dash-projects" aria-labelledby="dash-projects-title">
      <header className="cmd-panel-head">
        <h2 id="dash-projects-title">{title}</h2>
        <span className="cmd-count cmd-num">{projects.length}</span>
        <Link to="/todo" className="cmd-panel-more">전체 프로젝트</Link>
      </header>
      {projects.length === 0 ? (
        <div className="cmd-empty">
          <p className="cmd-empty-title">진행 중인 프로젝트가 없어요</p>
          <Link to="/todo" className="cmd-text-btn">프로젝트 목록 보기</Link>
        </div>
      ) : (
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th scope="col">프로젝트</th>
                <th scope="col">상태</th>
                <th scope="col">진척</th>
                <th scope="col">마감</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => {
                const d = dDay(p.endDate);
                const late = d !== null && d < 0 && p.status !== '완료';
                const soon = d !== null && d >= 0 && d <= 7 && p.status !== '완료';
                return (
                  <tr key={p.id} onClick={() => navigate(`/todo/${p.id}`)} className="is-link">
                    <td>
                      <Link to={`/todo/${p.id}`} className="dash-name" onClick={(e) => e.stopPropagation()}>{p.title}</Link>
                      {p.customerName && <span className="dash-sub">{p.customerName}</span>}
                    </td>
                    <td><span className={`cmd-lamp cmd-lamp--${late ? 'late' : statusLamp(p.status)}`}>{late ? '지연' : p.status || '-'}</span></td>
                    <td><StationStrip project={p} /></td>
                    <td className={`cmd-num dash-due${late ? ' is-late' : soon ? ' is-soon' : ''}`}>
                      {dDayText(d)}
                      <span className="dash-sub cmd-num">{p.endDate || ''}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/* ---------------- 내 이슈 ---------------- */

function IssuePanel({ issues, loading, error }) {
  const open = issues.filter((i) => OPEN_ISSUE_STATES.includes(i.status));
  const counts = OPEN_ISSUE_STATES.map((s) => ({ s, n: open.filter((i) => i.status === s).length })).filter(
    (c) => c.n > 0 || c.s !== '재오픈'
  );
  const recent = [...open].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).slice(0, 3);

  return (
    <section className="cmd-panel dash-issues" aria-labelledby="dash-issues-title">
      <header className="cmd-panel-head">
        <h2 id="dash-issues-title">내 이슈</h2>
        <span className="cmd-count cmd-num">{loading ? '–' : open.length}</span>
        <Link to="/issue" className="cmd-panel-more">전체 이슈</Link>
      </header>
      {error ? (
        <div className="cmd-empty cmd-empty--error" role="alert"><p className="cmd-empty-title">{error}</p></div>
      ) : (
        <>
          <dl className="cmd-stat-row dash-issue-counts">
            {counts.map(({ s, n }) => (
              <div key={s} className={`tone-${ISSUE_TONE[s]}`}>
                <dt>{s}</dt>
                <dd>{loading ? '–' : n}</dd>
              </div>
            ))}
          </dl>
          {!loading && recent.length > 0 && (
            <ul className="dash-issue-list">
              {recent.map((i) => (
                <li key={i.id}>
                  <Link to={`/issue/${i.id}`}>
                    <span className="cmd-num dash-code">ISS-{String(i.id).padStart(3, '0')}</span>
                    <span className="dash-issue-title">{i.title}</span>
                    <Priority value={i.priority} />
                    <span className={`cmd-chip tone-${ISSUE_TONE[i.status] || 'sky'}`}>{i.status}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {!loading && open.length === 0 && (
            <div className="cmd-empty"><p className="cmd-empty-title">처리할 이슈가 없어요</p></div>
          )}
        </>
      )}
    </section>
  );
}

/* ---------------- 공지 ---------------- */

function NoticePanel({ notices }) {
  return (
    <section className="cmd-panel dash-notices" aria-labelledby="dash-notices-title">
      <header className="cmd-panel-head">
        <h2 id="dash-notices-title">공지사항</h2>
        <Link to="/info" className="cmd-panel-more">전체 공지</Link>
      </header>
      {notices.length === 0 ? (
        <div className="cmd-empty"><p className="cmd-empty-title">등록된 공지가 없어요</p></div>
      ) : (
        <ul className="dash-notice-list">
          {notices.map((n) => (
            <li key={n.id}>
              <Link to={`/info/${n.id}`}>
                {Number(n.isPinned) === 1 && <span className="cmd-chip tone-purple">중요</span>}
                <span className="dash-notice-title">{n.title}</span>
                <span className="dash-sub cmd-num">{n.date}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ---------------- 대시보드 ---------------- */

function Home({ info = [], todo = [] }) {
  const user = getLoginUser();
  const [selectedDate, setSelectedDate] = useState(() => toISO(new Date()));
  const { schedules, loading, error, retry } = useDashboardSchedules();
  const issues = useMyIssues(user);

  // 내 프로젝트: 내가 담당이거나 등록한 진행 중 프로젝트, 마감이 가까운 순
  const { lines, linesTitle } = useMemo(() => {
    const active = todo.filter((p) => p.status !== '완료');
    const byDeadline = (a, b) => (parseDate(a.endDate)?.getTime() ?? Infinity) - (parseDate(b.endDate)?.getTime() ?? Infinity);
    const mine = active.filter((p) => Number(p.managerId) === Number(user.id) || Number(p.authorId) === Number(user.id));
    if (mine.length > 0) {
      return { lines: [...mine].sort(byDeadline).slice(0, 5), linesTitle: '내 프로젝트' };
    }
    return {
      lines: [...active].sort(byDeadline).slice(0, 5),
      linesTitle: '진행 중인 프로젝트',
    };
  }, [todo, user.id]);

  const sortedNotices = useMemo(
    () =>
      [...info]
        .sort((a, b) => {
          const ap = Number(a.isPinned) === 1;
          const bp = Number(b.isPinned) === 1;
          if (ap !== bp) return ap ? -1 : 1;
          return Number(b.id) - Number(a.id);
        })
        .slice(0, 4),
    [info]
  );

  const today = toISO(new Date());
  const todayCount = schedules.filter((s) => s.date === today).length;
  const overdue = lines.filter((p) => {
    const d = dDay(p.endDate);
    return d !== null && d < 0;
  }).length;
  const urgent = lines.filter((p) => {
    const d = dDay(p.endDate);
    return d !== null && d >= 0 && d <= 7;
  }).length;
  const pinned = info.find((n) => Number(n.isPinned) === 1);

  return (
    <div className="cmd-dash">
      <div className="dash-head">
        <h1 className="dash-title">
          {user.name} {user.rank}님, 오늘 일정 <b className="dash-title-num cmd-num">{loading ? '–' : todayCount}건</b>
        </h1>
        {overdue > 0 && (
          <span className="cmd-lamp cmd-lamp--late dash-urgent">
            마감 지남 <b className="cmd-num">{overdue}건</b>
          </span>
        )}
        {urgent > 0 && (
          <span className="cmd-lamp cmd-lamp--now dash-urgent dash-urgent--soon">
            마감 7일 이내 <b className="cmd-num">{urgent}건</b>
          </span>
        )}
        {pinned && (
          <Link to={`/info/${pinned.id}`} className="dash-pinned">
            <span className="cmd-chip tone-purple">공지</span>
            <span className="dash-pinned-title">{pinned.title}</span>
            <span className="dash-sub cmd-num">{pinned.date}</span>
          </Link>
        )}
      </div>

      <div className="dash-grid">
        <div className="dash-main">
          <DepartureBoard date={selectedDate} schedules={schedules} loading={loading} error={error} onRetry={retry} />
          <ProjectTable projects={lines} title={linesTitle} />
        </div>

        <div className="dash-side">
          <Calendar schedules={schedules} selectedDate={selectedDate} onSelect={setSelectedDate} loading={loading} />
          <IssuePanel {...issues} />
          <NoticePanel notices={sortedNotices} />
        </div>
      </div>
    </div>
  );
}

export default Home;
