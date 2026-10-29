function CalGrid({ WEEK_DAYS, weeks, year, month, getWeekBars, schedules, isPeriod, isVisible, toKey, todayKey, selectedKey, selectDay, TYPE_CLASS, openEditForm }) {
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

            {/* 주(週)마다 한 줄: 위에는 날짜 칸 7개, 아래에는 기간 막대들 */}
            {weeks.map((week, wi) => {
                const weekKeys = week.map((d) => (d === null ? null : toKey(year, month, d)));
                const bars = getWeekBars(weekKeys);
                // 막대가 쌓인 줄(lane) 개수: 0줄이면 막대 없음
                const laneCount = bars.reduce((max, b) => Math.max(max, b.lane + 1), 0);

                return (
                    <div
                        key={wi}
                        className="mp-weekrow"
                        // 1번 줄 = 날짜 숫자 자리(28px), 그다음 막대 줄들(15px씩), 마지막 = 여유 공간
                        style={{ gridTemplateRows: `28px${" 15px".repeat(laneCount)} minmax(8px, auto)` }}
                    >
                        {week.map((d, c) => {
                            if (d === null) {
                                return <div key={`blank-${c}`} className="mp-blank" style={{ gridColumn: c + 1, gridRow: 1 }} />;
                            }
                            const key = weekKeys[c];
                            // 막대로 그리지 않는 하루짜리 일정만 점으로 표시
                            const dots = schedules.filter(
                                (s) => !isPeriod(s) && s.start === key && isVisible(s)
                            );
                            const hasWork = dots.some((s) => s.type === "업무");
                            const hasPersonal = dots.some((s) => s.type === "개인");

                            let cls = "mp-day";
                            if (c === 0) cls += " sun";
                            if (key === todayKey) cls += " today";
                            if (key === selectedKey) cls += " selected";

                            return (
                                <button
                                    key={key}
                                    type="button"
                                    className={cls}
                                    // 날짜 칸을 막대 줄들까지 길게 늘려서, 막대가 칸 "안쪽"에 놓이게 해요
                                    style={{ gridColumn: c + 1, gridRow: `1 / span ${laneCount + 2}` }}
                                    onClick={() => selectDay(key)}
                                >
                                    {d}
                                    <span className="mp-dots">
                                        {hasWork && <i className="mp-dot work" />}
                                        {hasPersonal && <i className="mp-dot personal" />}
                                    </span>
                                </button>
                            );
                        })}

                        {bars.map((b) => (
                            <button
                                key={b.ev.id}
                                type="button"
                                className={`mp-seg ${TYPE_CLASS[b.ev.type]}${b.startsHere ? " starts" : ""}${b.endsHere ? " ends" : ""}`}
                                style={{
                                    gridRow: b.lane + 2,
                                    gridColumn: `${b.first + 1} / ${b.last + 2}`,
                                }}
                                title={`${b.ev.title} (${b.ev.start} ~ ${b.ev.end}) · 클릭하면 수정`}
                                onClick={() => openEditForm(b.ev)}
                            >
                                {b.ev.title}
                            </button>
                        ))}
                    </div>
                );
            })}
        </div>
    );
}

export default CalGrid;
