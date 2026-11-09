import { useState, useEffect } from "react";

// 날짜 한 칸에 이름(점 + 글자)을 최대 몇 줄까지 보여 줄지 (넘치는 것은 안 그리고, 날짜를 누르면 쪽지로 모두 보여 줘요)
const MAX_LANES = 3;

function CalGrid({
    WEEK_DAYS,
    weeks,
    year,
    month,
    getWeekBars,
    schedules,
    projectBars,
    isVisible,
    toKey,
    todayKey,
    selectedKey,
    selectDay,
    TYPE_CLASS,
    TYPE_ORDER,
    openEditForm,
}) {
    // 쪽지를 띄운 날짜 ("2026-11-16" 같은 글자, 없으면 null)
    const [noteKey, setNoteKey] = useState(null);
    // 이름을 눌러서 "막대로 펼친" 일정 ("업무-3" 같은 글자, 없으면 null)
    const [activeKey, setActiveKey] = useState(null);

    // 달을 넘기면 쪽지는 닫아요 (펼친 막대는 그대로 두어서, 다음·이전 달에서도 이어서 볼 수 있어요)
    useEffect(() => {
        setNoteKey(null);
    }, [year, month]);

    // Esc 키로 쪽지와 막대를 닫을 수 있게 해요
    useEffect(() => {
        if (!noteKey && !activeKey) return undefined;
        const onKeyDown = (e) => {
            if (e.key === "Escape") {
                setNoteKey(null);
                setActiveKey(null);
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [noteKey, activeKey]);

    // 그 날짜에 걸친 모든 일정 (프로젝트 → 업무 → 개인 → 휴가 순서)
    const itemsOn = (key) =>
        [
            ...projectBars.filter((p) => p.start <= key && key <= p.end).map((p) => ({ ...p, type: "프로젝트" })),
            ...schedules.filter((s) => s.type !== "프로젝트" && s.start <= key && key <= s.end && isVisible(s)),
        ].sort((a, b) => TYPE_ORDER[a.type] - TYPE_ORDER[b.type]);

    // 날짜를 누르면: 그 날짜를 선택하고, 일정이 2개 이상 겹치는 날이면 쪽지를 띄워요 (같은 날짜를 또 누르면 닫혀요)
    // 펼쳐 둔 막대는 접어요.
    const handleDayClick = (key) => {
        selectDay(key);
        setActiveKey(null);
        const overlapped = itemsOn(key).length >= 2;
        setNoteKey(overlapped && noteKey !== key ? key : null);
    };

    // 이름(점 + 글자)을 누르면: 그 일정의 기간 막대를 펼치고, 같은 이름을 또 누르면 접어요
    const handleNameClick = (barKey, dateKey) => {
        selectDay(dateKey);
        setNoteKey(null);
        setActiveKey(activeKey === barKey ? null : barKey);
    };

    return (
        <div className="mp-cal">
            {/* 요일 줄 */}
            <div className="mp-cal-head">
                {WEEK_DAYS.map((w, i) => (
                    <div key={w} className={i === 0 ? "mp-week sun" : "mp-week"}>
                        {w}
                    </div>
                ))}
            </div>

            {/* 주(週)마다 한 줄: 위에는 날짜 칸 7개, 아래에는 일정 이름들(펼치면 기간 막대) */}
            {weeks.map((week, wi) => {
                const weekKeys = week.map((d) => (d === null ? null : toKey(year, month, d)));
                const allBars = getWeekBars(weekKeys);
                // 화면에는 위에서 MAX_LANES 줄까지만 그려요
                const bars = allBars.filter((b) => b.lane < MAX_LANES);
                // 쌓인 줄(lane) 개수: 0줄이면 일정 없음
                const laneCount = bars.reduce((max, b) => Math.max(max, b.lane + 1), 0);

                // 쪽지가 이 주에 있는지 (있으면 몇 번째 칸인지)
                const noteCol = noteKey ? weekKeys.indexOf(noteKey) : -1;

                return (
                    <div
                        key={wi}
                        className="mp-weekrow"
                        // 1번 줄 = 날짜 숫자 자리(30px), 그다음 일정 줄들(18px씩), 마지막 = 여유 공간
                        style={{ gridTemplateRows: `30px${" 18px".repeat(laneCount)} minmax(6px, auto)` }}
                    >
                        {week.map((d, c) => {
                            if (d === null) {
                                return <div key={`blank-${c}`} className="mp-blank" style={{ gridColumn: c + 1, gridRow: 1 }} />;
                            }
                            const key = weekKeys[c];
                            let cls = "mp-day";
                            if (c === 0) cls += " sun";
                            if (key === todayKey) cls += " today";
                            if (key === selectedKey) cls += " selected";

                            return (
                                <button
                                    key={key}
                                    type="button"
                                    className={cls}
                                    // 날짜 칸을 줄들까지 길게 늘려서, 이름·막대가 칸 "안쪽"에 놓이게 해요
                                    style={{ gridColumn: c + 1, gridRow: `1 / span ${laneCount + 2}` }}
                                    onClick={() => handleDayClick(key)}
                                >
                                    <span className="mp-daynum">{d}</span>
                                </button>
                            );
                        })}

                        {bars.map((b) => {
                            const barKey = `${b.ev.type}-${b.ev.id}`;
                            const isProjectBar = b.ev.type === "프로젝트";

                            // 펼친 일정: 기간 전체를 하나의 막대로 (시작·종료일은 그 칸의 절반만 채워요)
                            if (barKey === activeKey) {
                                const span = b.last - b.first + 1; // 이번 주에 차지하는 칸 수
                                let cls = `mp-seg ${TYPE_CLASS[b.ev.type]}`;
                                if (b.startsHere) cls += " starts";
                                if (b.endsHere) cls += " ends";
                                if (b.startsHere && b.endsHere && span === 1) cls += " one";
                                return (
                                    <button
                                        key={barKey}
                                        type="button"
                                        className={cls}
                                        style={{
                                            "--n": span,
                                            gridRow: b.lane + 2,
                                            gridColumn: `${b.first + 1} / ${b.last + 2}`,
                                        }}
                                        title={`${b.ev.title} (${b.ev.start} ~ ${b.ev.end})${isProjectBar ? " · 누르면 접어요" : " · 클릭하면 수정"}`}
                                        // 프로젝트는 관리자 페이지에서만 고치니까, 누르면 막대를 접어요
                                        onClick={() => (isProjectBar ? setActiveKey(null) : openEditForm(b.ev))}
                                    >
                                        {b.ev.title}
                                    </button>
                                );
                            }

                            // 펼치지 않은 일정: 날짜마다 "● 이름" 한 줄씩
                            const cells = [];
                            for (let c = b.first; c <= b.last; c++) {
                                cells.push(
                                    <button
                                        key={`${barKey}-${c}`}
                                        type="button"
                                        className={`mp-line ${TYPE_CLASS[b.ev.type]}`}
                                        style={{ gridRow: b.lane + 2, gridColumn: c + 1 }}
                                        title={`${b.ev.title} (${b.ev.start} ~ ${b.ev.end}) · 누르면 기간 막대가 나와요`}
                                        onClick={() => handleNameClick(barKey, weekKeys[c])}
                                    >
                                        <i className="mp-line-dot" />
                                        <span>{b.ev.title}</span>
                                    </button>
                                );
                            }
                            return cells;
                        })}

                        {/* 쪽지: 그 날짜에 겹친 일정의 이름 · 시작일 · 종료일 */}
                        {noteCol !== -1 && (
                            <div
                                className="mp-pop"
                                role="dialog"
                                aria-label={`${noteKey} 일정 목록`}
                                style={
                                    noteCol >= 4
                                        ? { right: `calc(${6 - noteCol} * 100% / 7)` }
                                        : { left: `calc(${noteCol} * 100% / 7)` }
                                }
                            >
                                <div className="mp-pop-head">
                                    <strong>
                                        {Number(noteKey.slice(5, 7))}월 {Number(noteKey.slice(8, 10))}일
                                    </strong>
                                    <span>{itemsOn(noteKey).length}건</span>
                                    <button type="button" className="mp-pop-close" onClick={() => setNoteKey(null)} aria-label="쪽지 닫기">
                                        ×
                                    </button>
                                </div>
                                <ul>
                                    {itemsOn(noteKey).map((it) => (
                                        <li key={`${it.type}-${it.id}`}>
                                            <span className={`mp-pop-chip ${TYPE_CLASS[it.type]}`}>{it.type}</span>
                                            <div>
                                                <p className="mp-pop-name">{it.title}</p>
                                                <p className="mp-pop-date">
                                                    시작 {it.start} · 종료 {it.end}
                                                </p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export default CalGrid;
