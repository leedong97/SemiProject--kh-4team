import Breadcrumb from "../components/Breadcrumb";
import ServiceSteps from "../components/ServiceSteps";

/**
 * 상품 상세 화면
 * product: App에서 선택한 상품 객체
 * type: 업무 시스템몰인지, 클라우드몰인지 구분하는 값
 */
export default function DetailPage({ type, product, onNavigate }) {
  // 잘못된 URL로 들어와 상품을 찾지 못했을 때를 대비합니다.
  if (!product) {
    return (
      <div className="shell content">
        <h2>존재하지 않는 서비스입니다.</h2>
        <button type="button" className="btn" onClick={() => onNavigate("home")}>
          서비스 전체 보기
        </button>
      </div>
    );
  }

  return (
    <div className="shell">
      <Breadcrumb onHome={() => onNavigate("home")}>
        {type === "system" ? "업무 시스템 구축" : "클라우드·보안"}
        {" / "}{product.name}
      </Breadcrumb>

      <div className="details">
        <div className="illustration" aria-hidden="true">{product.icon}</div>
        <div className="detail-copy">
          <span className="eyebrow">
            {type === "system" ? "CUSTOM BUSINESS SOLUTION" : "CLOUD SERVICE PACKAGE"}
          </span>
          <h1>{product.name}</h1>
          <p className="desc">
            {product.description}. 고객사의 규모와 기존 시스템 환경을 검토해 구축 범위를 협의합니다.
          </p>

          <div className="tags">
            {/* features는 상품별 핵심 기능 목록입니다. */}
            {product.features.map((feature) => (
              <span key={feature}>✓ {feature}</span>
            ))}
          </div>

          <div className="priceblock">
            <strong>{product.price}</strong>
            <small>예시 시작가 · 실제 계약 금액은 요구사항에 따라 협의</small>
          </div>

          <div className="hero-actions">
            <button type="button" className="btn" onClick={() => onNavigate("quote")}>
              이 서비스 견적 요청 →
            </button>
            <button type="button" className="btn ghost" onClick={() => onNavigate("home")}>
              다른 서비스 보기
            </button>
          </div>
        </div>
      </div>

      <ServiceSteps />
    </div>
  );
}
