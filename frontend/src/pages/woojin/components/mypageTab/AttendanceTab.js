import { useState } from "react";

// 휴가 상태별 배지 색: 승인=초록, 대기=주황, 반려=빨강 (색은 Mypage.css)
const LEAVE_BADGE = { 승인: "s-approved", 대기: "s-pending", 반려: "s-rejected" };

// 연차 일수 규칙: 토·일은 세지 않아요 (서버 mypage.js의 countWorkdays와 같은 규칙이에요. 공휴일은 아직 평일로 세요)
function countWorkdays(start, end, type) {
    if (type === "반차") return 0.5;
    let days = 0;
    for (let t = Date.parse(start); t <= Date.parse(end); t += 86400000) {
        const dow = new Date(t).getUTCDay(); // 0=일, 6=토
        if (dow !== 0 && dow !== 6) days += 1;
    }
    return days;
}

function AttendanceTab({ weekHours, maxHours, leaveTotal, leaveHistory, todayKey, isDemo, onRequestLeave }) {
    // 휴가 신청 폼 입력값
    const [leaveType, setLeaveType] = useState("연차");
    const [leaveStart, setLeaveStart] = useState("");
    const [leaveEnd, setLeaveEnd] = useState("");
    const [leaveError, setLeaveError] = useState("");

    // 신청 버튼: 서버가 검사해서 거절하면 그 이유를 폼 아래에 보여 줘요
    const submitLeave = async (e) => {
        e.preventDefault();
        setLeaveError("");
        const end = leaveType === "반차" ? leaveStart : leaveEnd; // 반차는 하루라서 종료일 = 시작일
        if (!leaveStart || !end || leaveStart > end) return setLeaveError("휴가 기간을 확인해 주세요.");
        // 연차·반차는 남은 연차보다 많이 신청할 수 없어요 (서버도 한 번 더 검사해요)
        if (COUNTED_TYPES.includes(leaveType) && leaveStart.startsWith(thisYear)) {
            if (leaveStart.slice(0, 4) !== end.slice(0, 4)) return setLeaveError("해가 바뀌는 기간은 연도별로 나눠 신청해 주세요.");
            const requestDays = countWorkdays(leaveStart, end, leaveType);
            if (requestDays === 0) return setLeaveError("토·일만 선택하셨어요. 평일이 포함된 기간을 골라 주세요.");
            if (requestDays > remainLeave) {
                return setLeaveError(`남은 연차(${remainLeave}일)보다 많이 신청할 수 없어요. (신청 ${requestDays}일)`);
            }
        }
        const result = await onRequestLeave({
            leave_type: leaveType,
            start_date: leaveStart,
            end_date: end,
        });
        if (!result.ok) return setLeaveError(result.message);
        setLeaveStart("");
        setLeaveEnd("");
    };

    // 근태 · 연차 계산 (이 탭에서만 사용)
    const totalHours = weekHours.reduce((sum, w) => sum + w.hours, 0);
    // 하루 평균은 "근무 기록이 있는 날"만으로 나눠요. 아직 안 온 날(목·금)이나 휴가 날(0시간)까지 나누면 평균이 실제보다 낮아져요.
    const workedDays = weekHours.filter((w) => w.hours > 0).length;
    const avgHours = workedDays === 0 ? 0 : totalHours / workedDays; // 0으로 나누면 NaN 이라서 막아 둬요 (가드 절)
    // 연차 계산 (올해 신청분만 / 연차·반차만 세요. 병가·경조사는 연차에서 차감하지 않는 별도 휴가예요)
    //  - 사용     = 승인된 연차·반차 (날짜가 아직 안 왔어도 "승인되면" 바로 사용으로 세요)
    //  - 대기 중  = 아직 승인 전이지만 "예약"으로 미리 빼요 (안 그러면 승인 전에 계속 신청할 수 있어서 연차보다 많이 쓰게 돼요)
    //  - 남은 연차 = 총 연차 - 사용 - 대기 중   (반려되면 세지 않아서 자동으로 돌아와요)
    // 종류를 하나씩 빼는 방식(!== "병가")은 새 종류가 생기면 구멍이 나서, 센다고 정한 종류만 허용한다.
    const COUNTED_TYPES = ["연차", "반차"];
    const thisYear = todayKey.slice(0, 4); // 날짜가 "2026-11-06" 글자라서 앞 4글자가 연도
    const sumDays = (status) =>
        leaveHistory
            .filter((l) => l.status === status && COUNTED_TYPES.includes(l.type) && l.start.startsWith(thisYear))
            .reduce((sum, l) => sum + l.days, 0);
    const usedLeave = sumDays("승인");
    const pendingLeave = sumDays("대기");
    const remainLeave = leaveTotal - usedLeave - pendingLeave;
    const sortedLeave = [...leaveHistory].sort((a, b) => b.start.localeCompare(a.start));

    return (
        <section className="mp-panel">
            <h3>이번 주 근무 시간 (시간)</h3>
            <div
                className="mp-bars"
                role="img"
                aria-label={`이번 주 근무 시간 막대 그래프: ${weekHours
                    .map((w) => `${w.day} ${w.hours}시간`)
                    .join(", ")}`}
            >
                {weekHours.map((w) => (
                    <div key={w.day} className="mp-bar-col">
                        <span className="mp-bar-val">{w.hours}</span>
                        <div className="mp-bar-track">
                            <div
                                className="mp-bar-v"
                                style={{ height: `${(w.hours / maxHours) * 100}%` }}
                            />
                        </div>
                        <span className="mp-bar-day">{w.day}</span>
                    </div>
                ))}
            </div>
            <p className="mp-note">
                합계 {totalHours.toFixed(1)}시간 · 근무한 날 평균 {avgHours.toFixed(1)}시간
            </p>

            <h3>연차</h3>
            <div className="mp-leave-grid">
                <div className="mp-leave-card">
                    <span className="mp-stat-label">총 연차</span>
                    <strong>{leaveTotal}<small>일</small></strong>
                </div>
                <div className="mp-leave-card">
                    <span className="mp-stat-label">사용 (승인)</span>
                    <strong>{usedLeave}<small>일</small></strong>
                </div>
                <div className="mp-leave-card remain">
                    <span className="mp-stat-label">남은 연차</span>
                    <strong>{remainLeave}<small>일</small></strong>
                </div>
            </div>

            {/* 로그인한 직원만 신청할 수 있어요 (체험 모드는 토큰이 없어서 서버가 거절해요) */}
            {!isDemo && (
                <form className="mp-form" onSubmit={submitLeave}>
                    <h4>휴가 신청</h4>
                    <div className="mp-form-row">
                        <label>
                            종류
                            <select value={leaveType} onChange={(e) => setLeaveType(e.target.value)}>
                                <option>연차</option>
                                <option>반차</option>
                                <option>병가</option>
                                <option>경조사</option>
                            </select>
                        </label>
                        <label>
                            시작일
                            <input type="date" value={leaveStart} onChange={(e) => setLeaveStart(e.target.value)} />
                        </label>
                        {leaveType !== "반차" && (
                            <label>
                                종료일
                                <input type="date" min={leaveStart} value={leaveEnd} onChange={(e) => setLeaveEnd(e.target.value)} />
                            </label>
                        )}
                    </div>
                    {leaveError && <p className="mp-error">{leaveError}</p>}
                    <div className="mp-form-btns">
                        <button type="submit" className="mp-submit">신청하기</button>
                    </div>
                </form>
            )}

            <h3>휴가 신청 내역</h3>
            {/* 휴가 내역이 0건이면(새로 가입한 직원 등) 빈 안내를 보여 줘요 */}
            {sortedLeave.length === 0 && <p className="mp-note">휴가 신청 내역이 없어요.</p>}
            {sortedLeave.map((l) => (
                <div key={l.id} className="mp-card mp-task">
                    <span>
                        {l.start}{l.end !== l.start ? ` ~ ${l.end}` : ""} · {l.type}
                    </span>
                    <span className={`mp-badge ${LEAVE_BADGE[l.status] || "s-wait"}`}>{l.days}일 · {l.status}</span>
                </div>
            ))}

        </section>
    );
}

export default AttendanceTab;
