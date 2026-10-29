// 일정 추가·수정 폼
function SchForm({ showForm, formRef, editingId, form, handleChange, TYPES, error, closeForm, handleSave }) {
    if (!showForm) return null;

    return (
        <div className="mp-form" ref={formRef}>
            <h4>
                {editingId === null ? "새 일정 등록" : "일정 수정"}
            </h4>

            <label>
                일정 제목
                <input
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="예: 연차 휴가, 개발 스터디"
                />
            </label>

            <div className="mp-form-row">
                <label>
                    시작일
                    <input type="date" name="start" value={form.start} onChange={handleChange} />
                </label>
                <label>
                    종료일
                    <input
                        type="date"
                        name="end"
                        value={form.end}
                        min={form.start}
                        onChange={handleChange}
                    />
                </label>
            </div>

            <div className="mp-form-row">
                <label>
                    구분
                    <select name="type" value={form.type} onChange={handleChange}>
                        {TYPES.map((t) => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>
                </label>
                {(form.type === "업무" || form.type === "개인") && (
                    <label>
                        시간
                        <input
                            type="time"
                            name="time"
                            value={form.time}
                            onChange={handleChange}
                        />
                    </label>
                )}
            </div>

            {error && <p className="mp-error">{error}</p>}

            <div className="mp-form-btns">
                <button type="button" className="mp-cancel" onClick={closeForm}>
                    취소
                </button>
                <button type="button" className="mp-submit" onClick={handleSave}>
                    {editingId === null ? "일정 추가" : "수정 저장"}
                </button>
            </div>
        </div>
    );
}

export default SchForm;
