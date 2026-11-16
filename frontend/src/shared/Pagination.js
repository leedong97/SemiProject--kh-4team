import React from "react";
import "./Pagination.css";

// 일반 이슈관리 기준: 10건씩, 페이지 번호는 5개씩 표시합니다.
export default function Pagination({ total, currentPage, onPage, pageSize = 10, label = "목록 페이지" }) {
    if (total === 0) return null;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const activePage = Math.max(1, Math.min(currentPage, totalPages));
    const start = (activePage - 1) * pageSize;
    const first = Math.floor((activePage - 1) / 5) * 5 + 1;
    const pages = Array.from({ length: Math.min(5, totalPages - first + 1) }, (_, i) => first + i);
    return (
        <nav className="standard-pagination" aria-label={label}>
            <span className="standard-pagination-summary" aria-live="polite">
                전체 {total}건 중 {start + 1}–{Math.min(start + pageSize, total)}건
            </span>
            <div className="standard-pagination-buttons">
                <button type="button" disabled={activePage === 1} onClick={() => onPage(activePage - 1)}>이전</button>
                {pages.map(page => (
                    <button key={page} type="button" aria-label={page + "페이지"}
                        aria-current={activePage === page ? "page" : undefined}
                        onClick={() => onPage(page)}>{page}</button>
                ))}
                <button type="button" disabled={activePage === totalPages} onClick={() => onPage(activePage + 1)}>다음</button>
            </div>
        </nav>
    );
}
