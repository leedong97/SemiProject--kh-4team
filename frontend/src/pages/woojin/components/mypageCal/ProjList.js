function ProjList({ projectBars, todayKey, countDays }) {
    // 보여 줄 프로젝트가 없으면 아무것도 그리지 않아요 (가드 절)
    // 프로젝트는 관리자 페이지에서만 등록·수정해서, 여기서는 보기만 해요 (눌러도 수정창이 안 열려요)
    if (projectBars.length === 0) return null;

    return (
        <div className="mp-projects">
            <h4>진행 · 예정 프로젝트</h4>
            {projectBars.map((p) => {
                // 오늘 기준으로 "남은 기한"을 계산해요 (오늘 → 종료일까지 몇 일 남았나)
                const total = countDays(p.start, p.end);
                let remain; // 남은 일수
                let label; // 오른쪽에 보여 줄 말
                if (todayKey < p.start) {
                    remain = total;
                    label = `시작까지 ${countDays(todayKey, p.start) - 1}일`;
                } else if (todayKey > p.end) {
                    remain = 0;
                    label = "기간 지남"; // 상태는 완료가 아닌데 종료일이 지난 프로젝트
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
