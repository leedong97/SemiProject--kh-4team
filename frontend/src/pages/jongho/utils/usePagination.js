import { useEffect, useState } from "react";

// 목록을 페이지로 나눈다.
// items: 전체 목록(이미 필터·정렬된 것), pageSize: 한 페이지 개수,
// resetKeys: 이 값들이 바뀌면 1페이지로 돌아간다 (검색어, 필터, 정렬 등)
export default function usePagination(items, pageSize, resetKeys = []) {
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, resetKeys);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageItems = items.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return {
    pageItems,
    currentPage,
    totalPages,
    total: items.length,
    goPrev: () => setPage(currentPage - 1),
    goNext: () => setPage(currentPage + 1),
  };
}
