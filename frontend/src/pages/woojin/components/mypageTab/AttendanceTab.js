// 근태·휴가 탭 (주간 근무시간·연차)
function AttendanceTab({ weekHours, maxHours, leaveTotal, leaveHistory, todayKey, isDemo }) {
    const totalHours = weekHours.reduce((sum, w) => sum + w.hours, 0);
    const workedDays = weekHours.filter((w) => w.hours > 0).length;
    const avgHours = workedDays === 0 ? 0 : totalHours / workedDays;
    const COUNTED_TYPES = ["연차", "반차"];
    const usedLeave = leaveHistory
        .filter((l) => l.status === "승인" && COUNTED_TYPES.includes(l.type) && l.end <= todayKey)
        .reduce((sum, l) => sum + l.days, 0);
    const remainLeave = leaveTotal - usedLeave;
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
                    <span className="mp-stat-label">사용</span>
                    <strong>{usedLeave}<small>일</small></strong>
                </div>
                <div className="mp-leave-card remain">
                    <span className="mp-stat-label">남은 연차</span>
                    <strong>{remainLeave}<small>일</small></strong>
                </div>
            </div>

            <h3>휴가 신청 내역</h3>
            {sortedLeave.length === 0 && <p className="mp-note">휴가 신청 내역이 없어요.</p>}
            {sortedLeave.map((l) => (
                <div key={l.id} className="mp-card mp-task">
                    <span>
                        {l.start}{l.end !== l.start ? ` ~ ${l.end}` : ""} · {l.type}
                    </span>
                    <span className="mp-badge s-wait">{l.days}일 · {l.status}</span>
                </div>
            ))}

            <p className="mp-note">
                {isDemo ? "체험 모드: 근무 시간은 예시 숫자예요. " : "근무 시간은 출퇴근 기록(점심 1시간 제외)으로 계산해요. "}
                연차 사용 일수는 승인되고 이미 끝난 연차·반차만 세요(병가·경조사 제외).
            </p>
        </section>
    );
}

export default AttendanceTab;
