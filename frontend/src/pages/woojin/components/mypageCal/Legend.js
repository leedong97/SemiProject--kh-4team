// 달력 위에 두는 막대·색 설명 (예전에는 달력 아래 일정 목록 쪽에 있었어요)
function Legend() {
    return (
        <p className="mp-legend mp-legend-top">
            <i className="mp-dot project" /> 프로젝트 &nbsp;
            <i className="mp-dot work" /> 업무 &nbsp;
            <i className="mp-dot personal" /> 개인 &nbsp;
            <i className="mp-dot leave" /> 휴가 &nbsp;
        </p>
    );
}

export default Legend;
