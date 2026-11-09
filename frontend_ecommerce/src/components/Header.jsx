/**
 * 공통 헤더 컴포넌트
 * onNavigate: App에서 내려주는 화면 이동 함수(props)
 */
export default function Header({ onNavigate }) {
  return (
    <header className="top">
      <div className="shell nav">
        <a
          href="#home"
          className="brand"
          onClick={(event) => {
            event.preventDefault();
            onNavigate("home");
          }}
        >
          COMMAND <strong>SOLUTIONS</strong>
          <small>BUSINESS IT SERVICE STORE</small>
        </a>

        <nav className="links" aria-label="주요 메뉴">
          <button type="button" onClick={() => onNavigate("home")}>
            서비스몰
          </button>
          <button type="button" onClick={() => onNavigate("flow")}>
            이용 절차·ERP 연동
          </button>
          <button type="button" onClick={() => onNavigate("quote")}>
            맞춤 견적
          </button>
        </nav>

        <button type="button" className="cta" onClick={() => onNavigate("quote")}>
          견적 문의 ↗
        </button>
      </div>
    </header>
  );
}
