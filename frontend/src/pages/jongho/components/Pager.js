// 이전 / 다음 페이지 버튼 (페이지가 한 장뿐이면 아무것도 그리지 않는다)
export default function Pager({ currentPage, totalPages, total, onPrev, onNext }) {
  if (totalPages <= 1) return null;

  return (
    <div className="nexus-pager">
      <button className="btn btn-outline btn-sm" type="button"
        disabled={currentPage === 1} onClick={onPrev}>
        이전
      </button>
      <span>{currentPage} / {totalPages} (전체 {total}개)</span>
      <button className="btn btn-outline btn-sm" type="button"
        disabled={currentPage === totalPages} onClick={onNext}>
        다음
      </button>
    </div>
  );
}
