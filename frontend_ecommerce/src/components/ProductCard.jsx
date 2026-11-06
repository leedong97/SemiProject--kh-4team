/**
 * 상품 한 개를 카드로 보여 주는 재사용 컴포넌트입니다.
 * product: 상품 데이터 객체
 * onDetail: '상세 보기'를 눌렀을 때 실행할 함수
 * 소개 카드(버튼 없음)에서는 onDetail을 생략할 수 있습니다.
 */
export default function ProductCard({ product, onDetail, compact = false }) {
  return (
    <article className="product" style={compact ? { minHeight: 180 } : undefined}>
      <div className="symbol" aria-hidden="true">{product.icon}</div>
      <h3>{product.name}</h3>
      <p>{product.description}</p>

      {/* 상세 페이지 이동 버튼은 실제 상품 카드에만 보여줍니다. */}
      {onDetail && (
        <div className="foot">
          <span className="price">{product.price}</span>
          <button type="button" className="back" onClick={onDetail}>
            상세 보기 ↗
          </button>
        </div>
      )}
    </article>
  );
}
