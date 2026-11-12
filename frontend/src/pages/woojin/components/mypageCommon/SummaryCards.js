// 요약 숫자 3개를 한 줄로 (큰 카드 대신)
function SummaryCards({ activeProjectCount, workCountThisMonth, personalCountThisMonth }) {
    return (
        <dl className="mp-stats cmd-stat-row" aria-label="내 업무 요약">
            <div className="tone-green">
                <dt>진행 중 프로젝트</dt>
                <dd className="cmd-num">{activeProjectCount}<small>건</small></dd>
            </div>
            <div className="tone-sky">
                <dt>이번 달 업무 일정</dt>
                <dd className="cmd-num">{workCountThisMonth}<small>건</small></dd>
            </div>
            <div className="tone-orange">
                <dt>이번 달 개인 일정</dt>
                <dd className="cmd-num">{personalCountThisMonth}<small>건</small></dd>
            </div>
        </dl>
    );
}

export default SummaryCards;
