function ProjList({ monthProjects, todayKey, openEditForm, countDays }) {
    // 이번 달에 걸친 프로젝트가 없으면 아무것도 그리지 않아요 (가드 절)
    if (monthProjects.length === 0) return null;

    return (
        <div className="mp-projects">
            <h4>진행 중인 프로젝트</h4>
            {monthProjects.map((p) => {
                // 오늘 기준으로 "남은 기한"을 계산해요 (오늘 → 종료일까지 몇 일 남았나)
                const total = countDays(p.start, p.end);
                let remain; // 남은 일수
                let label; // 오른쪽에 보여 줄 말
                if (todayKey < p.start) {
                    remain = total;
                    label = `시작까지 ${countDays(todayKey, p.start) - 1}일`;
                } else if (todayKey > p.end) {
                    remain = 0;
                    label = "종료";
                } else {
                    remain = countDays(todayKey, p.end) - 1;
                    label = remain === 0 ? "오늘 마감" : `D-${remain}`;
                }
                // 남은 기한 단계로 색을 정해요: 7일 이내 빨강 / 14일 이내 주황 / 그 외 초록 / 끝났거나 시작 전 회색
                let level = "ok";
                if (todayKey > p.end || todayKey < p.start) level = "idle";
                else if (remain <= 7) level = "danger";
                else if (remain <= 14) level = "warn";
                return (
                    <button
                        key={p.id}
                        type="button"
                        className={`mp-proj ${level}`}
                        title="클릭하면 수정"
                        onClick={() => openEditForm(p)}
                    >
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
                    </button>
                );
            })}
        </div>
    );
}

export default ProjList;
