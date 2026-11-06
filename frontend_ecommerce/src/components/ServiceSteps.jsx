import { serviceSteps } from "../data/services";

// 상세 페이지에서 반복되는 5단계 소개 영역입니다.
export default function ServiceSteps() {
  return (
    <section className="flow">
      <h2>서비스 진행 단계</h2>
      <div className="steps">
        {serviceSteps.map((step, index) => (
          <div className="step" key={step.name}>
            <em aria-hidden="true">{step.icon}</em>
            <strong>{String(index + 1).padStart(2, "0")}. {step.name}</strong>
            <span>{step.description}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
