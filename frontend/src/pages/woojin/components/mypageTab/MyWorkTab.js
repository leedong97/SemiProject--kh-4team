// 내 업무 탭 (프로젝트·담당 업무)
function MyWorkTab({ projects, tasks }) {
    return (
        <section className="mp-panel">
            <h3>참여 중인 프로젝트</h3>
            {projects.length === 0 && <p className="mp-empty">참여 중인 프로젝트가 없어요.</p>}
            {projects.map((p) => (
                <div key={p.id} className="mp-card">
                    <p className="mp-item-title">{p.name}</p>
                    <p className="mp-item-sub">{p.role}</p>
                    <div className="mp-progress">
                        <div className="mp-bar">
                            <div className="mp-bar-fill" style={{ width: `${p.progress}%` }} />
                        </div>
                        <span>{p.progress}%</span>
                    </div>
                </div>
            ))}

            <h3>내 담당 업무</h3>
            {tasks.length === 0 && <p className="mp-empty">담당 업무가 없어요.</p>}
            {tasks.map((t) => (
                <div key={t.id} className="mp-card mp-task">
                    <span>{t.title}</span>
                    <span className={`mp-badge s-${t.status === "진행 중" ? "doing" : t.status === "완료" ? "done" : "wait"}`}>
                        {t.status}
                    </span>
                </div>
            ))}
        </section>
    );
}

export default MyWorkTab;
