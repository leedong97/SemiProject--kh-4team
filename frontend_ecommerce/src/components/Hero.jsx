// 홈 페이지 맨 위의 소개 배너입니다. 서비스 유형에 따라 문구만 바뀝니다.
export default function Hero({ category, onNavigate }) {
  const barHeights = [35, 55, 42, 80, 65, 100];

  const scrollToServices = () => {
    // React에서도 화면의 특정 id로 스크롤할 수 있습니다.
    document.getElementById("services")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="hero">
      <div className="shell hero-inner">
        <div className="copy">
          <span className="eyebrow">{category.eyebrow}</span>
          {/* 원본 headline의 \n 줄바꿈은 CSS white-space: pre-line이 표시합니다. */}
          <h1>{category.headline}</h1>
          <p>{category.sub}</p>
          <div className="hero-actions">
            <button type="button" className="btn white" onClick={() => onNavigate("quote")}>
              무료 견적 요청 →
            </button>
            <button type="button" className="btn" onClick={scrollToServices}>
              서비스 둘러보기 ↓
            </button>
          </div>
        </div>

        {/* 실제 통계가 아닌 디자인용 대시보드 미리보기입니다. */}
        <aside className="hero-art" aria-label="대시보드 디자인 예시">
          <div className="metric">
            NEXUS IT 운영 대시보드 <strong>● ACTIVE</strong>
          </div>
          <div className="fake">
            {barHeights.map((height, index) => (
              <i key={index} className="bar" style={{ height: `${height}%` }} />
            ))}
          </div>
          <div className="sub">
            <span>프로젝트 관리</span>
            <span>서비스 운영</span>
          </div>
        </aside>
      </div>
    </section>
  );
}
