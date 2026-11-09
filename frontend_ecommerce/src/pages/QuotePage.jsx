import Breadcrumb from "../components/Breadcrumb";

/**
 * 견적 신청 화면
 * submitted: App에서 관리하는 신청 완료 여부(true/false)
 * onSubmit: 서버 전송 없이 데모 완료 화면으로 바꾸는 함수
 * selectedIndex: 상세 페이지에서 선택한 상품의 번호
 */
export default function QuotePage({ products, selectedIndex, submitted, onSubmit, onNavigate }) {
  return (
    <div className="shell">
      <Breadcrumb onHome={() => onNavigate("home")}>견적 신청</Breadcrumb>
      <div className="form-wrap">
        <h1>프로젝트 견적 신청</h1>
        <p className="muted">필요한 IT 서비스를 선택하고 기업의 요구사항을 남겨주세요.</p>

        {submitted ? (
          // submitted가 true일 때만 신청 완료 내용을 보여줍니다.
          <div className="success" role="status">
            <h2>입력 확인이 완료되었습니다</h2>
            <p>
              온라인 견적 접수 기능을 준비 중입니다.
            </p>
            <button type="button" className="btn ghost" onClick={() => onNavigate("home")}>
              서비스몰 돌아가기
            </button>
          </div>
        ) : (
          // JSX에서는 onsubmit="..." 대신 onSubmit={함수}를 사용합니다.
          <form onSubmit={onSubmit}>
            <div className="field">
              <label htmlFor="service">신청 서비스 *</label>
              <select id="service" name="service" required defaultValue={String(selectedIndex)}>
                {products.map((product, index) => (
                  <option key={product.name} value={String(index)}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="company">기업명 *</label>
              <input
                id="company"
                name="company"
                required
                placeholder="예: ABC 주식회사"
              />
            </div>

            <div className="field">
              <label htmlFor="email">담당자 이메일 *</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="contact@company.com"
              />
            </div>

            <div className="field">
              <label htmlFor="budget">예산 범위</label>
              <select id="budget" name="budget" defaultValue="">
                <option value="">선택하세요</option>
                <option>100만원 미만</option>
                <option>100~300만원</option>
                <option>300~500만원</option>
                <option>500만원 이상</option>
                <option>별도 협의</option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="requirements">구축 요구사항 *</label>
              <textarea
                id="requirements"
                name="requirements"
                required
                placeholder="현재 사용 중인 시스템, 필요한 기능, 희망 일정 등을 입력해주세요."
              />
            </div>

            <div style={{ marginTop: 24 }}>
              <button className="btn" type="submit">
                입력 내용 접수 →
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
