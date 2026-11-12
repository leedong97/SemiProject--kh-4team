import React, { useEffect, useRef, useState } from "react";

// 입력값과 실제 검색값을 분리해 Enter 또는 검색 버튼으로만 반영합니다. (동협 폴더에서 가져옴)
// 버튼 색은 직접 정하지 않고 공통 스타일(.cmd-btn, shared/components.css)을 따라가요.
export default function SearchInput({ value = "", onChange, style, ...props }) {
  const [draft, setDraft] = useState(value);
  const inputRef = useRef(null);
  const composing = useRef(false);

  useEffect(() => { setDraft(value); }, [value]);

  const submit = () => {
    if (composing.current) return;
    const input = inputRef.current;
    onChange({ target: input, currentTarget: input });
  };

  return (
    <span className="manual-search" style={{ display: "inline-flex", gap: 8, alignItems: "center", flex: "1 1 auto", minWidth: 0, maxWidth: "100%" }}>
      <input
        {...props}
        ref={inputRef}
        value={draft}
        style={{ ...style, flex: "1 1 auto", minWidth: 0, width: "100%" }}
        onChange={(event) => setDraft(event.target.value)}
        onCompositionStart={() => { composing.current = true; }}
        onCompositionEnd={() => { composing.current = false; }}
        onKeyDown={(event) => {
          if (event.key !== "Enter") return;
          if (composing.current || event.nativeEvent.isComposing || event.keyCode === 229) return;
          event.preventDefault();
          submit();
        }}
      />
      <button type="button" className="cmd-btn manual-search-btn" onClick={submit} aria-label={(props["aria-label"] || props.placeholder || "검색어") + " 검색 실행"}
        style={{ flexShrink: 0, whiteSpace: "nowrap" }}>
        검색
      </button>
    </span>
  );
}
