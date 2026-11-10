// 이전 / 1 2 3 ... / 다음 페이지 버튼.
// 숫자는 한 번에 10쪽씩 보여주고, 이전·다음은 한 쪽씩 움직인다. 끝 페이지에서는 해당 버튼이 비활성화된다.
export default function NumberedPager({ currentPage, totalPages, total, pageSize, onPage }) {
    if (totalPages <= 1) return null;
  
    // "전체 14건 중 1–10건" 안내 문구 (개수와 페이지 크기를 받은 경우에만)
    const hasSummary = typeof total === "number" && typeof pageSize === "number";
    const from = (currentPage - 1) * (pageSize || 0) + 1;
    const to = Math.min(total || 0, currentPage * (pageSize || 0));
  
    const groupStart = Math.floor((currentPage - 1) / 10) * 10 + 1;
    const groupEnd = Math.min(totalPages, groupStart + 9);
    const pages = [];
    for (let page = groupStart; page <= groupEnd; page += 1) {
      pages.push(page);
    }
  
    return (
      <div className="nexus-pager-wrap">
        {hasSummary && (
          <p className="nexus-pager-summary">전체 {total}건 중 {from}–{to}건</p>
        )}
      <div className="nexus-pager nexus-pager-numbers">
        <button
          type="button"
          className="btn btn-outline btn-sm"
          disabled={currentPage === 1}
          onClick={() => onPage(currentPage - 1)}
        >
          이전
        </button>
  
        {pages.map((page) => (
          <button
            key={page}
            type="button"
            className={"btn btn-sm " + (page === currentPage ? "btn-primary" : "btn-outline")}
            aria-current={page === currentPage ? "page" : undefined}
            onClick={() => onPage(page)}
          >
            {page}
          </button>
        ))}
  
        <button
          type="button"
          className="btn btn-outline btn-sm"
          disabled={currentPage === totalPages}
          onClick={() => onPage(currentPage + 1)}
        >
          다음
        </button>
      </div>
      </div>
    );
  }