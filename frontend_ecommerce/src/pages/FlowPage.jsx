import NoticeBanner from "../components/NoticeBanner";
import ProductCard from "../components/ProductCard";
import { processStages, erpFeatures } from "../data/services";

/**
 * 서비스몰 이용 절차 / ERP 연동 소개 화면
 * 실제 ERP API가 호출되는 것이 아니라 연결될 과정을 설명하는 페이지입니다.
 */
export default function FlowPage({ type }) {
  const stages = processStages[type];

  return (
    <div className="shell content">
      <div className="section-title">
        <div>
          <h2>고객부터 관리자 ERP까지</h2>
          <p>쇼핑몰에서 접수된 요청이 NEXUS ERP의 업무로 연결되는 서비스 흐름입니다.</p>
        </div>
      </div>

      <div className="flow-carousel" key={type}>
        {stages.map((stage, index) => (
          <div
            key={stage.name}
            className="flow-box flow-orbit-card"
            style={{ animationDelay: `${-index * 1.3}s` }}
          >
            <div className="emo" aria-hidden="true">
              {stage.icon}
            </div>
            <h3>{stage.name}</h3>
            <p>{stage.description}</p>
          </div>
        ))}
      </div>

      <div className="section-title" style={{ marginTop: 60 }}>
        <div>
          <h2>COMMAND ERP 관리자 기능과 연결</h2>
          <p>데모 기획안: 실제 API 및 DB 연동은 구현되지 않았습니다.</p>
        </div>
      </div>

      <div className="grid">
        {erpFeatures.map((feature) => (
          <ProductCard key={feature.name} product={feature} compact />
        ))}
      </div>

      <NoticeBanner
        title="쇼핑몰 + ERP 통합 서비스"
        description="고객 요청 → 견적·계약 → 프로젝트 → 이슈 관리 → 완료 및 유지보수"
        buttonText="데모 버전 체험"
        onClick={() => {
          window.location.assign(
            import.meta.env.VITE_ERP_DEMO_URL ||
            "http://localhost:3000/preview"
          );
        }}
      />
    </div>
  );
}
