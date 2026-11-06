import { useEffect, useRef } from "react";
import "../styles/showcase.css";

const process = [
  {
    title: "Discover",
    subtitle: "문제를 이해합니다",
    description: "지금의 업무 방식과 필요한 변화를 함께 살펴봅니다."
  },
  {
    title: "Design",
    subtitle: "맞는 방법을 설계합니다",
    description: "사용자의 흐름부터 기능과 시스템 구조까지 구체화합니다."
  },
  {
    title: "Build",
    subtitle: "아이디어를 현실로",
    description: "설계한 경험을 구현하고 실제 사용 환경에서 검수합니다."
  },
  {
    title: "Connect",
    subtitle: "운영까지 이어갑니다",
    description: "도입 이후에도 개선과 유지보수로 다음 변화를 준비합니다."
  }
];

export default function HomePage({ category, onNavigate }) {
  const pageRef = useRef(null);
  const cloud = category.eyebrow === "CLOUD & SECURITY";

  useEffect(() => {
    const root = pageRef.current;

    if (
      !root ||
      !("IntersectionObserver" in window) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const items = root.querySelectorAll("[data-reveal]");
    root.classList.add("cs-motion");

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    items.forEach(item => observer.observe(item));

    return () => {
      observer.disconnect();
      root.classList.remove("cs-motion");
    };
  }, []);

  function scrollToServices() {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    document.getElementById("services")?.scrollIntoView({
      behavior: reduced ? "auto" : "smooth",
      block: "start"
    });
  }

  return (
    <div className="cs-home" ref={pageRef}>
      <section className="cs-hero" aria-labelledby="cs-hero-title">
        <div className="cs-hero-top">
          <span className="cs-eyebrow">
            <i aria-hidden="true" />
            COMMAND SOLUTIONS
          </span>
          <span className="cs-hero-category">{category.eyebrow}</span>
        </div>

        <div className="cs-hero-grid">
          <div className="cs-hero-copy">
            <p className="cs-kicker">YOUR NEXT MOVE, BUILT TOGETHER.</p>

            <h1 id="cs-hero-title">
              {cloud ? "Beyond" : "Make"}
              <br />
              {cloud ? "the cloud." : "work flow."}
            </h1>

            <p className="cs-hero-description">
              {cloud
                ? "비즈니스의 다음 가능성을 여는 인프라."
                : "복잡한 업무를, 자연스러운 흐름으로."}
              <br />
              {cloud
                ? "클라우드부터 보안까지 함께 설계합니다."
                : "당신의 비즈니스에 맞는 시스템을 만듭니다."}
            </p>

            <div className="cs-hero-actions">
              <button
                type="button"
                className="cs-button cs-button-lime"
                onClick={scrollToServices}
              >
                솔루션 둘러보기 <span aria-hidden="true">↗</span>
              </button>

              <button
                type="button"
                className="cs-text-button"
                onClick={() => onNavigate("quote")}
              >
                프로젝트 상담하기 <span aria-hidden="true">↗</span>
              </button>
            </div>
          </div>

          <div className="cs-art" aria-hidden="true">
            <div className="cs-art-grid" />
            <div className="cs-orbit cs-orbit-one" />
            <div className="cs-orbit cs-orbit-two" />
            <div className="cs-orbit cs-orbit-three" />
            <div className="cs-art-core">C</div>
            <span className="cs-art-label cs-art-label-top">
              IDEAS INTO SYSTEMS
            </span>
            <span className="cs-art-label cs-art-label-bottom">
              CONNECT. CREATE. COMMAND.
            </span>
            <span className="cs-art-dot" />
          </div>
        </div>

        <div className="cs-hero-bottom">
          <span>BUSINESS SYSTEMS / CLOUD / OPERATIONS</span>
          <button type="button" onClick={scrollToServices}>
            SCROLL TO EXPLORE <span aria-hidden="true">↓</span>
          </button>
        </div>
      </section>

      <section className="cs-about cs-container" data-reveal>
        <div className="cs-section-label">
          <span>01 / OUR APPROACH</span>
          <span>기술보다 먼저, 당신의 업무를 봅니다.</span>
        </div>

        <div className="cs-about-grid">
          <h2>
            좋은 시스템은
            <br />
            <span>일하는 방식</span>을
            <br />
            바꿉니다.
          </h2>

          <div className="cs-about-copy">
            <p>
              흩어진 정보는 하나로,
              <br />
              반복되는 일은 더 간단하게.
            </p>

            <p>
              예약부터 고객 관리, 재고와 주문, 클라우드 운영까지.
              필요한 기능을 연결해 팀이 중요한 일에 집중할 수 있는
              환경을 설계합니다.
            </p>

            <button
              type="button"
              className="cs-inline-link"
              onClick={() => onNavigate("flow")}
            >
              우리가 함께 일하는 방법
              <span aria-hidden="true">↗</span>
            </button>
          </div>
        </div>

        <div className="cs-principles">
          <span>Designed for people.</span>
          <span>Built for business.</span>
          <span>Ready for what’s next.</span>
        </div>
      </section>

      <section className="cs-services" id="services">
        <div className="cs-container">
          <div className="cs-section-label" data-reveal>
            <span>02 / SELECTED SOLUTIONS</span>
            <span>시연용 서비스 · 가상 가격</span>
          </div>

          <div className="cs-section-heading" data-reveal>
            <h2>
              Small steps.
              <br />
              <span>Big possibilities.</span>
            </h2>
            <p>
              {cloud ? "안정적인 인프라가 만드는 차이." : "우리 팀에 필요한 변화부터."}
              <br />
              서비스를 선택해 자세히 살펴보세요.
            </p>
          </div>

          <div className="cs-service-list">
            {category.products.map((product, index) => (
              <button
                key={`${category.eyebrow}-${product.name}`}
                type="button"
                className="cs-service"
                onClick={() => onNavigate("detail", index)}
              >
                <span className="cs-service-number">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <span className="cs-service-info">
                  <strong>{product.name}</strong>
                  <span>{product.description}</span>
                  <span className="cs-service-tags">
                    {product.features.map(feature => (
                      <span key={feature}>{feature}</span>
                    ))}
                  </span>
                </span>

                <span className="cs-service-price">{product.price}</span>

                <span className="cs-service-arrow" aria-hidden="true">
                  ↗
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="cs-process cs-container">
        <div className="cs-section-label" data-reveal>
          <span>03 / HOW WE WORK</span>
          <button
            type="button"
            className="cs-inline-link"
            onClick={() => onNavigate("flow")}
          >
            전체 과정 보기 <span aria-hidden="true">↗</span>
          </button>
        </div>

        <h2 data-reveal>
          처음의 질문부터,
          <br />
          <span>다음의 가능성까지.</span>
        </h2>

        <div className="cs-process-grid">
          {process.map((step, index) => (
            <article className="cs-process-step" key={step.title} data-reveal>
              <span className="cs-step-number">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3>{step.title}</h3>
              <strong>{step.subtitle}</strong>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="cs-contact" data-reveal>
        <div className="cs-container cs-contact-inner">
          <div>
            <p className="cs-kicker">YOUR IDEAS. OUR NEXT PROJECT.</p>
            <h2>
              Let’s make
              <br />
              <span>it happen.</span>
            </h2>
            <p className="cs-contact-description">
              어떤 변화가 필요한가요? 함께 시작해요.
            </p>
          </div>

          <button
            type="button"
            className="cs-contact-button"
            onClick={() => onNavigate("quote")}
          >
            <span>프로젝트 문의</span>
            <span aria-hidden="true">↗</span>
          </button>
        </div>
      </section>
    </div>
  );
}