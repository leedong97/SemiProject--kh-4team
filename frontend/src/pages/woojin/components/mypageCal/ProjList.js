// 진행 중 프로젝트 목록
function ProjList({ projectBars, todayKey, countDays }) {
    if (projectBars.length === 0) return null;

    return (
        <div className="mp-projects">
            <h4>진행 · 예정 프로젝트</h4>
            {projectBars.map((p) => {
                const total = countDays(p.start, p.end);
                let remain;
                let label;
                if (todayKey < p.start) {
                    remain = total;
                    label = `시작까지 ${countDays(todayKey, p.start) - 1}일`;
                } else if (todayKey > p.end) {
                    remain = 0;
                    label = "기간 지남";
                } else {
                    remain = countDays(todayKey, p.end) - 1;
                    label = remain === 0 ? "오늘 마감" : `D-${remain}`;
                }
                let level = "ok";
                if (todayKey > p.end || todayKey < p.start) level = "idle";
                else if (remain <= 7) level = "danger";
                else if (remain <= 14) level = "warn";
                return (
                    <div key={p.id} className={`mp-proj ${level}`}>
                        <span className="mp-proj-name">{p.title}</span>
                        <span
                            className="mp-proj-track"
                            role="img"
                            aria-label={`${p.title} 남은 기한 ${label}`}
                        >
                            <span className="mp-proj-fill" style={{ width: `${(remain / total) * 100}%` }} />
                        </span>
                        <span className="mp-proj-date">
                            <strong>{label}</strong> · {p.start.slice(5).replace("-", "/")} ~ {p.end.slice(5).replace("-", "/")} ({total}일)
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

export default ProjList;
