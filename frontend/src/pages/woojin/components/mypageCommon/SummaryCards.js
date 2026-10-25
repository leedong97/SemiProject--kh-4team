function SummaryCards({ activeProjectCount, inProgressCount, personalCountThisMonth }) {
    return (
        <section className="mp-stats">
            <div className="mp-stat">
                <span className="mp-stat-label">참여 프로젝트</span>
                <strong>{activeProjectCount}<small>건</small></strong>
            </div>
            <div className="mp-stat">
                <span className="mp-stat-label">진행 중 업무</span>
                <strong>
                    {inProgressCount}
                    <small>건</small>
                </strong>
            </div>
            <div className="mp-stat">
                <span className="mp-stat-label">이번 달 개인 일정</span>
                <strong>{personalCountThisMonth}<small>건</small></strong>
            </div>
        </section>
    );
}

export default SummaryCards;
