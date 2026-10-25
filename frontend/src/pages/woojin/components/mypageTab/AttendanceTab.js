function AttendanceTab({ weekHours, maxHours, leaveTotal, leaveHistory }) {
    // 근태 · 연차 계산 (이 탭에서만 사용)
    const totalHours = weekHours.reduce((sum, w) => sum + w.hours, 0);
    const avgHours = totalHours / weekHours.length;
    const usedLeave = leaveHistory.reduce((sum, l) => sum + l.days, 0);
    const remainLeave = leaveTotal - usedLeave;
    const sortedLeave = [...leaveHistory].sort((a, b) => b.date.localeCompare(a.date));

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
                합계 {totalHours}시간 · 하루 평균 {avgHours.toFixed(1)}시간
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

            <h3>연차 사용 내역</h3>
            {sortedLeave.map((l) => (
                <div key={l.id} className="mp-card mp-task">
                    <span>{l.date} · {l.type}</span>
                    <span className="mp-badge s-wait">{l.days}일</span>
                </div>
            ))}

            <p className="mp-note">
                프로토타입: 근무 시간과 연차는 예시 숫자예요. 실제 값은 근태 데이터와 연결한 뒤 채워져요.
            </p>
        </section>
    );
}

export default AttendanceTab;
