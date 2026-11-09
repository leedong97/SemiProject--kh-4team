export default function Hero({ category, onNavigate }) {
  const bars = [35, 52, 44, 68, 58, 82, 72, 95];

  const handleMove = (event) => {
    if (
      event.pointerType === "touch" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const area = event.currentTarget;
    const rect = area.getBoundingClientRect();
    const clamp = (value) => Math.max(-1, Math.min(1, value));

    const x = clamp(((event.clientX - rect.left) / rect.width - 0.5) * 2);
    const y = clamp(((event.clientY - rect.top) / rect.height - 0.5) * 2);

    area.style.setProperty("--rx", `${-y * 7}deg`);
    area.style.setProperty("--ry", `${x * 9}deg`);
  };

  const resetMove = (event) => {
    event.currentTarget.style.removeProperty("--rx");
    event.currentTarget.style.removeProperty("--ry");
  };

  const scrollToServices = () => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    document.getElementById("services")?.scrollIntoView({
      behavior: reduced ? "auto" : "smooth",
    });
  };

  return (
    <section className="cm-hero">
      <div className="cm-hero-grid" aria-hidden="true" />

      <div className="cm-container">
        <div className="cm-layout">
          <div className="cm-copy">
            <div className="cm-eyebrow">
              <span />
              {category.eyebrow}
            </div>

            <h1>{category.headline}</h1>

            <p className="cm-description">{category.sub}</p>

            <div className="cm-actions">
              <button
                type="button"
                className="cm-button cm-button-primary"
                onClick={() => onNavigate("quote")}
              >
                프로젝트 시작하기 <span>↗</span>
              </button>

              <button
                type="button"
                className="cm-button cm-button-secondary"
                onClick={scrollToServices}
              >
                서비스 살펴보기 <span>↓</span>
              </button>
            </div>

            <div className="cm-caption">
              BUSINESS SYSTEMS. CONNECTED.
            </div>
          </div>

          <div
            className="cm-scene"
            onPointerMove={handleMove}
            onPointerLeave={resetMove}
            onPointerCancel={resetMove}
            role="img"
            aria-label="요청 접수부터 프로젝트 진행, ERP 연결까지 보여주는 디자인 예시"
          >
            <div className="cm-orbit cm-orbit-one" aria-hidden="true" />
            <div className="cm-orbit cm-orbit-two" aria-hidden="true" />

            <div className="cm-stack" aria-hidden="true">
              <div className="cm-back-panel" />

              <div className="cm-dashboard">
                <div className="cm-panel-header">
                  <span className="cm-panel-brand">COMMAND</span>
                  <span className="cm-live">
                    <i /> SYSTEM ONLINE
                  </span>
                </div>

                <div className="cm-panel-heading">
                  <div>
                    <span className="cm-small-label">
                      WORKSPACE OVERVIEW
                    </span>
                    <h2>업무의 흐름을 한눈에.</h2>
                  </div>

                  <span className="cm-panel-arrow">↗</span>
                </div>

                <div className="cm-chart">
                  <div className="cm-chart-top">
                    <span>프로젝트 진행 현황</span>
                    <span>PREVIEW</span>
                  </div>

                  <div className="cm-bars">
                    {bars.map((height, index) => (
                      <span
                        key={index}
                        style={{
                          height: `${height}%`,
                          animationDelay: `${index * 65}ms`,
                        }}
                      />
                    ))}
                  </div>

                  <div className="cm-chart-bottom">
                    <span>PLAN</span>
                    <span>BUILD</span>
                    <span>GROW</span>
                  </div>
                </div>

                <div className="cm-panel-footer">
                  <span><i /> 프로젝트 관리</span>
                  <span><i /> 서비스 운영</span>
                  <span><i /> 데이터 연결</span>
                </div>
              </div>

              <div className="cm-float-card cm-request">
                <span className="cm-float-icon">↗</span>
                <div>
                  <span className="cm-small-label">NEW REQUEST</span>
                  <strong>새로운 가능성의 시작</strong>
                  <span className="cm-float-description">
                    견적 접수 · 프로젝트 연결
                  </span>
                </div>
                <span className="cm-status-dot" />
              </div>

              <div className="cm-float-card cm-connected">
                <span className="cm-check">✓</span>
                <div>
                  <span className="cm-small-label">ALL CONNECTED</span>
                  <strong>하나의 흐름으로 연결</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="cm-bottom">
          <span>FROM YOUR IDEA TO YOUR SYSTEM.</span>
          <button type="button" onClick={scrollToServices}>
            SCROLL TO EXPLORE <span>↓</span>
          </button>
        </div>
      </div>
    </section>
  );
}