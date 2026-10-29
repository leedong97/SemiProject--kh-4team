// 일정 종류 필터
function FilterBar({ filter, setFilter, FILTERS }) {

    return (
        <div className="mp-filters" role="group" aria-label="일정 종류 필터">
            {FILTERS.map((name) => (
                <button
                    key={name}
                    type="button"
                    className={filter === name ? "mp-chip active" : "mp-chip"}
                    onClick={() => setFilter(name)}
                >
                    {name}
                </button>
            ))}
        </div>
    );
}

export default FilterBar;
