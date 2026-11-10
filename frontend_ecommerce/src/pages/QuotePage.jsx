import Breadcrumb from "../components/Breadcrumb";
import { useRef, useState } from "react";
import { API_BASE, getToken } from "../shopAuth";

/**
 * 견적 신청 화면
 * submitted: App에서 관리하는 신청 완료 여부(true/false)
 * onSubmit: 서버 전송 없이 데모 완료 화면으로 바꾸는 함수
 * selectedIndex: 상세 페이지에서 선택한 상품의 번호
 */


export default function QuotePage({ products, selectedIndex, submitted, onSubmit, onNavigate }) {
  const [pending, setPending] = useState(false);
const [error, setError] = useState("");
const submitting = useRef(false);

async function handleSubmit(event) {
  event.preventDefault();
  if (submitting.current) return;

  const data = new FormData(event.currentTarget);
  const product = products[Number(data.get("service"))];

  if (!product) {
    setError("신청 서비스를 선택해주세요.");
    return;
  }

  const payload = {
    service: product.name,
    company: String(data.get("company") ?? "").trim(),
    email: String(data.get("email") ?? "").trim(),
    budget: String(data.get("budget") ?? ""),
    requirements: String(data.get("requirements") ?? "").trim(),
  };

  if (
    !payload.company || payload.company.length > 100 ||
    payload.email.length > 254 ||
    !payload.requirements || payload.requirements.length > 5000
  ) {
    setError("기업명은 100자, 이메일은 254자, 요구사항은 5,000자 이내로 입력해주세요.");
    return;
  }

  submitting.current = true;
  setPending(true);
  setError("");

  try {
    const response = await fetch(`${API_BASE}/api/dong/quotes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(result?.message || "견적 신청에 실패했습니다.");
    }

    if (!result?.id) {
      throw new Error("접수 결과를 확인할 수 없습니다.");
    }

    onSubmit(event);
  } catch (err) {
    setError(
      err instanceof TypeError
        ? "서버에 연결할 수 없습니다. 연결 상태를 확인해주세요."
        : err.message
    );
  } finally {
    submitting.current = false;
    setPending(false);
  }
}
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
          <form onSubmit={handleSubmit} aria-busy={pending}>
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
              {error && <p role="alert">{error}</p>}
              <button className="btn" type="submit" disabled={pending}>
                {pending ? "접수 중..." : "견적 신청하기 →"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
