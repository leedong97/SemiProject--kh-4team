import React from "react";

// 관리자 화면에서 공통으로 사용하는 페이지네이션입니다.
// 페이지 이동 기능은 각 화면에서 전달한 함수를 그대로 실행합니다.
export default function AdminPagination({ currentPage, totalPages, total, onPageChange, onPrev, onNext }) {
    if (totalPages <= 1) return null;
    const pages = [];
    const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
    const end = Math.min(totalPages, start + 4);
    for (let page = start; page <= end; page++) pages.push(page);
    const goTo = (page) => {
        if (onPageChange) onPageChange(page);
        else if (page < currentPage && onPrev) onPrev();
        else if (page > currentPage && onNext) onNext();
    };
    return (
        <nav className="nexus-unified-pagination" aria-label="페이지 이동">
            <span className="nexus-pagination-total">{total == null ? `총 ${totalPages}페이지` : `전체 ${total}건`}</span>
            <div className="nexus-pagination-controls">
                <button type="button" disabled={currentPage <= 1} onClick={() => goTo(currentPage - 1)}>이전</button>
                {start > 1 && <><button type="button" onClick={() => goTo(1)}>1</button>{start > 2 && <span className="nexus-pagination-dots">…</span>}</>}
                {pages.map(page => <button type="button" key={page} className={page === currentPage ? "active" : ""} aria-current={page === currentPage ? "page" : undefined} onClick={() => goTo(page)}>{page}</button>)}
                {end < totalPages && <>{end < totalPages - 1 && <span className="nexus-pagination-dots">…</span>}<button type="button" onClick={() => goTo(totalPages)}>{totalPages}</button></>}
                <button type="button" disabled={currentPage >= totalPages} onClick={() => goTo(currentPage + 1)}>다음</button>
            </div>
        </nav>
    );
}
