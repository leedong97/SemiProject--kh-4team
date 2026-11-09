import { useRef, useState } from "react";
import "../styles/command-home.css";

const modules = [
  {
    id: "project",
    label: "프로젝트",
    en: "PROJECT MANAGEMENT",
    title: "시작부터 완료까지,\n업무의 맥락이 이어지도록.",
    description:
      "프로젝트와 담당자, 진행 상태를 한곳에서 확인합니다. 팀이 같은 정보를 보고 다음 업무를 판단할 수 있도록 구성합니다.",
    features: ["프로젝트 목록·상세", "참여 인원 관리", "완료 요청·검토"],
    columns: ["준비", "진행", "검토"],
    cards: [
      ["요구사항 정리", "담당자 배정"],
      ["화면 개발", "기능 구현"],
      ["결과 확인", "완료 요청"],
    ],
  },
  {
    id: "issue",
    label: "이슈",
    en: "ISSUE TRACKING",
    title: "작은 요청도,\n놓치지 않는 흐름.",
    description:
      "발생한 문제와 필요한 작업을 기록합니다. 처리 과정과 완료 요청을 연결해 업무의 다음 단계를 확인합니다.",
    features: ["이슈 등록·조회", "작업 기록", "완료 요청·승인"],
    columns: ["접수", "처리", "확인"],
    cards: [
      ["개선 요청", "오류 확인"],
      ["원인 분석", "수정 작업"],
      ["처리 검토", "완료 승인"],
    ],
  },
  {
    id: "people",
    label: "인사",
    en: "PEOPLE & OPERATIONS",
    title: "사람과 업무를,\n함께 이해하는 관리.",
    description:
      "직원 정보와 휴가, 평가 업무를 연결합니다. 일상적인 운영부터 검토가 필요한 요청까지 흐름에 맞게 관리합니다.",
    features: ["직원 정보 관리", "휴가 신청·검토", "직원 평가"],
    columns: ["직원", "요청", "검토"],
    cards: [
      ["직원 정보", "소속 관리"],
      ["휴가 신청", "평가 작성"],
      ["신청 검토", "평가 확인"],
    ],
  },
];

const stages = [
  {
    number: "01",
    title: "Discover",
    name: "업무를 이해합니다",
    description:
      "현재의 업무 방식과 불편한 지점을 살펴보고, 필요한 기능과 우선순위를 정리합니다.",
    tags: ["요구사항", "업무 분석"],
    art: "discover",
  },
  {
    number: "02",
    title: "Design",
    name: "흐름을 설계합니다",
    description:
      "사용자가 보는 화면부터 데이터가 쌓이는 구조까지, 하나의 흐름으로 구체화합니다.",
    tags: ["화면 설계", "데이터 구조"],
    art: "design",
  },
  {
    number: "03",
    title: "Build",
    name: "기능을 연결합니다",
    description:
      "화면과 서버를 연결하고 실제 업무 시나리오에 따라 동작을 확인합니다.",
    tags: ["기능 개발", "통합 확인"],
    art: "build",
  },
  {
    number: "04",
    title: "Operate",
    name: "다음을 준비합니다",
    description:
      "운영 중 확인되는 문제와 개선점을 정리하고, 변화하는 업무에 맞춰 발전시킵니다.",
    tags: ["운영 점검", "기능 개선"],
    art: "operate",
  },
];

function Workspace({ module, compact = false }) {
  return (
    <div className={`nx-workspace ${compact ? "is-compact" : ""}`}>
      <div className="nx-window-bar">
        <span className="nx-window-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span>COMMAND / WORKSPACE</span>
        <span className="nx-window-mark" aria-hidden="true">↗</span>
      </div>

      <div className="nx-workspace-body">
        <div className="nx-workspace-heading">
          <div>
            <span className="nx-micro">{module.en}</span>
            <h3>{module.label} 워크스페이스</h3>
          </div>
          <span className="nx-example-label">화면 구성 예시</span>
        </div>

        <div className="nx-board">
          {module.columns.map((column, index) => (
            <div className="nx-board-column" key={column}>
              <div className="nx-board-label">
                <i aria-hidden="true" />
                {column}
              </div>

              {module.cards[index].map((card, cardIndex) => (
                <div className="nx-task" key={card}>
                  <span className="nx-task-code">
                    CMD / 0{index + 1}{cardIndex + 1}
                  </span>
                  <strong>{card}</strong>
                  <div className="nx-task-lines" aria-hidden="true">
                    <i />
                    <i />
                  </div>
                  <div className="nx-task-bottom" aria-hidden="true">
                    <span>{cardIndex === 0 ? "WORK" : "TEAM"}</span>
                    <b>{index + 1}</b>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="nx-workspace-footer">
          <span>PROJECT</span>
          <i aria-hidden="true" />
          <span>PEOPLE</span>
          <i aria-hidden="true" />
          <span>WORKFLOW</span>
        </div>
      </div>
    </div>
  );
}

function HeroVisual({ cloud }) {
  const sceneRef = useRef(null);

  function handleMove(event) {
    if (
      event.pointerType !== "mouse" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const element = sceneRef.current;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    element.style.setProperty("--nx-rx", `${-y * 8}deg`);
    element.style.setProperty("--nx-ry", `${x * 10}deg`);
  }

  function resetMove() {
    sceneRef.current?.style.setProperty("--nx-rx", "0deg");
    sceneRef.current?.style.setProperty("--nx-ry", "0deg");
  }

  return (
    <div
      className="nx-scene"
      ref={sceneRef}
      onPointerMove={handleMove}
      onPointerLeave={resetMove}
      aria-hidden="true"
    >
      <div className="nx-scene-grid" />
      <div className="nx-scene-ring" />
      <div className="nx-scene-ring nx-scene-ring-two" />

      <div className="nx-scene-stack">
        <div className="nx-panel-back" />

        <div className="nx-main-panel">
          <Workspace module={modules[0]} compact />
        </div>

        <div className="nx-floating nx-floating-top">
          <span className="nx-floating-icon">↗</span>
          <div>
            <span className="nx-micro">
              {cloud ? "INFRASTRUCTURE" : "CONNECTED WORK"}
            </span>
            <strong>
              {cloud ? "서비스를 지탱하는 구조" : "하나로 이어지는 업무"}
            </strong>
          </div>
        </div>

        <div className="nx-floating nx-floating-bottom">
          <span className="nx-floating-icon">⌘</span>
          <div>
            <span className="nx-micro">SYSTEM DESIGN</span>
            <strong>화면에서 데이터까지</strong>
          </div>
          <span className="nx-floating-path">UI → API → DB</span>
        </div>
      </div>
    </div>
  );
}

export default function HomePage({ category, onNavigate }) {
  const [activeModule, setActiveModule] = useState(0);
  const servicesRef = useRef(null);
  const cloud = category.eyebrow === "CLOUD & SECURITY";
  const currentModule = modules[activeModule];

  function scrollToServices() {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    servicesRef.current?.scrollIntoView({
      behavior: reduced ? "auto" : "smooth",
      block: "start",
    });
  }

  return (
    <div className="nx-home">
      {/* 첫 화면 */}
      <section className="nx-hero">
        <div className="nx-container">
          <div className="nx-hero-top">
            <span className="nx-eyebrow">
              <i aria-hidden="true" />
              COMMAND SOLUTIONS
            </span>
            <span className="nx-micro">{category.eyebrow}</span>
          </div>

          <div className="nx-hero-layout">
            <div className="nx-hero-copy">
              <p className="nx-kicker">BUILT AROUND YOUR BUSINESS</p>
              <h1>
                {cloud ? "가능성은 넓게," : "흩어진 업무를,"}
                <br />
                <span>{cloud ? "기반은 견고하게." : "하나의 시스템으로."}</span>
              </h1>
              <p className="nx-description">
                {cloud
                  ? "클라우드, 데이터, 운영 환경까지. 비즈니스의 다음 단계를 위한 인프라를 함께 설계합니다."
                  : "사람과 업무, 데이터를 연결합니다. 당신의 팀이 중요한 일에 집중할 수 있도록."}
              </p>
              <div className="nx-actions">
                <button className="nx-button" onClick={scrollToServices}>
                  솔루션 둘러보기 <span aria-hidden="true">↗</span>
                </button>
                <button
                  className="nx-text-button"
                  onClick={() => onNavigate("quote")}
                >
                  맞춤 견적 문의 <span aria-hidden="true">↗</span>
                </button>
              </div>
            </div>

            <HeroVisual cloud={cloud} />
          </div>

          <div className="nx-hero-bottom">
            <span>BUSINESS SYSTEMS · CLOUD · OPERATIONS</span>
            <button onClick={scrollToServices}>
              EXPLORE THE SYSTEM <span aria-hidden="true">↓</span>
            </button>
          </div>
        </div>
      </section>

      {/* 회사의 접근 방식 */}
      <section className="nx-section nx-intro">
        <div className="nx-container">
          <div className="nx-section-meta">
            <span>01 / WHY COMMAND</span>
            <span>업무를 이해하는 기술</span>
          </div>
          <div className="nx-intro-grid">
            <h2>
              기능을 만드는 것을 넘어,
              <br />
              <span>일하는 방식을 연결합니다.</span>
            </h2>
            <p>
              정보가 흩어지고, 같은 일을 반복하고,
              <br />
              다음 단계를 확인하기 어려웠다면.
              <br /><br />
              필요한 화면과 기능, 데이터를 연결해
              <br />
              우리 팀에 맞는 업무 환경을 설계할 때입니다.
            </p>
          </div>
          <div className="nx-keywords">
            <span>01 — Clear structure</span>
            <span>02 — Connected workflow</span>
            <span>03 — Thoughtful experience</span>
          </div>
        </div>
      </section>

      {/* 기능 선택 */}
      <section className="nx-section nx-product-section">
        <div className="nx-container">
          <div className="nx-section-meta">
            <span>02 / INSIDE THE PRODUCT</span>
            <span>COMMAND ERP</span>
          </div>

          <div className="nx-section-heading">
            <h2>업무의 흐름을<br /><span>직접 살펴보세요.</span></h2>
            <p>기능을 선택하면 화면 구성과 설명이 바뀝니다.</p>
          </div>

          <div className="nx-module-switch" aria-label="소개할 기능 선택">
            {modules.map((module, index) => (
              <button
                key={module.id}
                type="button"
                aria-pressed={activeModule === index}
                aria-controls="nx-module-content"
                onClick={() => setActiveModule(index)}
              >
                <span>0{index + 1}</span>
                {module.label} 관리
                <span aria-hidden="true">↗</span>
              </button>
            ))}
          </div>

          <div className="nx-module-layout" id="nx-module-content">
            <div className="nx-module-copy">
              <span className="nx-kicker">{currentModule.en}</span>
              <h3>{currentModule.title}</h3>
              <p>{currentModule.description}</p>
              <ul>
                {currentModule.features.map((feature) => (
                  <li key={feature}><span aria-hidden="true">↗</span>{feature}</li>
                ))}
              </ul>
            </div>
            <div className="nx-module-preview" key={currentModule.id}>
              <Workspace module={currentModule} />
            </div>
          </div>
        </div>
      </section>

      {/* 기술 구조 */}
      <section className="nx-section nx-architecture">
        <div className="nx-container">
          <div className="nx-section-meta">
            <span>03 / UNDER THE SURFACE</span>
            <span>화면 뒤의 구조까지</span>
          </div>

          <div className="nx-section-heading">
            <h2>좋은 경험은,<br /><span>연결된 구조에서.</span></h2>
            <p>
              현재 COMMAND ERP를 구성하는 기술입니다.
              <br />사용자의 입력이 서버를 거쳐 데이터로 이어집니다.
            </p>
          </div>

          <div className="nx-system-map">
            <article>
              <span className="nx-system-number">01 / INTERFACE</span>
              <div className="nx-system-symbol" aria-hidden="true">⌘</div>
              <h3>사용자 화면</h3>
              <p>업무에 필요한 정보를 보여주고<br />사용자의 입력을 전달합니다.</p>
              <span className="nx-tech">React</span>
            </article>
            <span className="nx-system-connector" aria-hidden="true">↔</span>
            <article>
              <span className="nx-system-number">02 / APPLICATION</span>
              <div className="nx-system-symbol" aria-hidden="true">{"{ }"}</div>
              <h3>업무 로직</h3>
              <p>요청을 처리하고 기능별로<br />필요한 데이터를 연결합니다.</p>
              <span className="nx-tech">Node.js · Express</span>
            </article>
            <span className="nx-system-connector" aria-hidden="true">↔</span>
            <article>
              <span className="nx-system-number">03 / DATABASE</span>
              <div className="nx-system-symbol" aria-hidden="true">▤</div>
              <h3>데이터 관리</h3>
              <p>직원과 프로젝트, 업무 기록을<br />구조화하여 저장합니다.</p>
              <span className="nx-tech">MySQL</span>
            </article>
          </div>
        </div>
      </section>

      {/* 기존 상품 데이터와 상세 페이지 연결 */}
      <section className="nx-section nx-services" ref={servicesRef}>
        <div className="nx-container">
          <div className="nx-section-meta">
            <span>04 / OUR SOLUTIONS</span>
            <span>{category.eyebrow}</span>
          </div>

          <div className="nx-section-heading">
            <h2>
              {cloud ? "다음 성장을 위한" : "우리 팀에 필요한"}
              <br />
              <span>{cloud ? "인프라를 선택하세요." : "변화부터 시작하세요."}</span>
            </h2>
            <p>서비스별 기능과 제공 범위를 살펴보세요.</p>
          </div>

          <div className="nx-services-list">
            {category.products.map((product, index) => (
              <button
                className="nx-service"
                key={product.name}
                onClick={() => onNavigate("detail", index)}
              >
                <span className="nx-service-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="nx-service-info">
                  <strong>{product.name}</strong>
                  <span>{product.description}</span>
                  <span className="nx-service-tags">
                    {product.features.map((feature) => (
                      <span key={feature}>{feature}</span>
                    ))}
                  </span>
                </span>
                <span className="nx-service-price">{product.price}</span>
                <span className="nx-service-arrow" aria-hidden="true">↗</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 구축 과정 */}
      <section className="nx-section nx-process">
        <div className="nx-container">
          <div className="nx-section-meta">
            <span>05 / HOW WE BUILD</span>
            <button
              className="nx-inline-button"
              onClick={() => onNavigate("flow")}
            >
              전체 과정 보기 ↗
            </button>
          </div>

          <div className="nx-section-heading">
            <h2>처음의 질문부터,<br /><span>운영의 다음 단계까지.</span></h2>
          </div>

          <div className="nx-process-grid">
            {stages.map((stage) => (
              <article className="nx-process-card" key={stage.number}>
                <div className="nx-process-top">
                  <span>STEP {stage.number}</span>
                  <span>{stage.title}</span>
                </div>
                <div className={`nx-process-art nx-art-${stage.art}`} aria-hidden="true">
                  <i /><i /><i />
                  <span>{stage.number}</span>
                </div>
                <h3>{stage.name}</h3>
                <p>{stage.description}</p>
                <div className="nx-process-tags">
                  {stage.tags.map((tag) => <span key={tag}>{tag}</span>)}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 견적 연결 */}
      <section className="nx-contact">
        <div className="nx-container nx-contact-inner">
          <div>
            <p className="nx-kicker">YOUR NEXT PROJECT STARTS HERE</p>
            <h2>다음 변화,<br />함께 만들까요?</h2>
            <p>필요한 서비스와 생각하고 있는 프로젝트를 알려주세요.</p>
          </div>
          <button
            className="nx-contact-button"
            onClick={() => onNavigate("quote")}
          >
            <span>맞춤 견적 문의</span>
            <span aria-hidden="true">↗</span>
          </button>
        </div>
      </section>
    </div>
  );
}