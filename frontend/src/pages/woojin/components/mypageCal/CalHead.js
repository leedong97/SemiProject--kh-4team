// 달력 머리글 (월 이동·일정 추가 버튼)
function CalHead({ year, month, prevMonth, nextMonth, showForm, editingId, closeForm, openAddForm }) {
    return (
        <div className="mp-cal-top">
            <div className="mp-cal-nav">
                <button type="button" onClick={prevMonth}>이전</button>
                <strong>{year}년 {month + 1}월</strong>
                <button type="button" onClick={nextMonth}>다음</button>
            </div>
            <button
                type="button"
                className="mp-add-btn"
                onClick={() => (showForm && editingId === null ? closeForm() : openAddForm())}
            >
                + 일정 등록
            </button>
        </div>
    );
}

export default CalHead;
