function DayList({ selectedLabel, selectedSchedules, filter, countDays, TYPE_CLASS, openEditForm, handleDelete }) {
    return (
        <>
            <p className="mp-legend">
                <i className="mp-dot work" /> 업무 &nbsp;
                <i className="mp-dot personal" /> 개인 &nbsp;
                <i className="mp-dot leave" /> 휴가 &nbsp;
                <span className="mp-legend-tip">막대를 누르면 바로 수정할 수 있어요</span>
            </p>

            <div className="mp-day-head">
                <h3>{selectedLabel} 일정</h3>
                <span>총 {selectedSchedules.length}건</span>
            </div>

            {selectedSchedules.length === 0 && (
                <p className="mp-empty">
                    {filter === "전체"
                        ? "이 날짜에는 등록된 일정이 없어요."
                        : `이 날짜에는 ${filter} 일정이 없어요.`}
                </p>
            )}

            {selectedSchedules.map((s) => (
                <div key={s.id} className={`mp-item ${TYPE_CLASS[s.type]}`}>
                    <div>
                        <p className="mp-item-title">{s.title}</p>
                        <p className="mp-item-sub">
                            {s.start === s.end
                                ? `${s.time ? `${s.time} · ` : ""}${s.type}`
                                : `${s.start} ~ ${s.end} (${countDays(s.start, s.end)}일) · ${s.type}`}
                        </p>
                    </div>
                    <div className="mp-actions">
                        <button type="button" className="mp-edit" onClick={() => openEditForm(s)}>
                            수정
                        </button>
                        <button type="button" className="mp-del" onClick={() => handleDelete(s.id)}>
                            삭제
                        </button>
                    </div>
                </div>
            ))}
        </>
    );
}

export default DayList;
