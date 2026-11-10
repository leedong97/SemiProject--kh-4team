// 칩 버튼 줄 (예: 전체 / 기간 초과). 선택된 칩만 강조한다.
// options: [{ value, label }], value: 현재 선택값, onChange: 선택값을 받는 함수
export default function FilterChips({ label, options, value, onChange }) {
    return (
      <div className="nexus-filter-chips" role="group" aria-label={label}>
        {options.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={String(option.value)}
              type="button"
              className={"nexus-filter-chip" + (active ? " is-active" : "")}
              aria-pressed={active}
              onClick={() => onChange(option.value)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    );
  }