export default function PricingFooter() {
    return (
        <footer className="pricing-footer">
            <div className="pricing-footer-banner">
                <div className="pricing-container">
                    <h2>팀의 업무를 더 간편하게</h2>
                    <p>
                        일정부터 프로젝트까지,
                        우리 팀에 맞는 플랜으로 시작하세요.
                    </p>

                    <a href="#plans" className="pricing-primary-button">
                        요금제 선택하기
                    </a>
                </div>
            </div>

            <div className="pricing-container">
                <div className="pricing-footer-main">
                    <div>
                        <a href="#plans" className="pricing-logo">
                            WORKSPACE
                        </a>
                        <p className="pricing-footer-description">
                            팀을 위한 통합 업무 관리 서비스
                        </p>
                    </div>

                    <nav className="pricing-footer-nav" aria-label="하단 메뉴">
                        <a href="#plans">요금제</a>
                        <a href="#features">기능 비교</a>
                        <a href="#faq">자주 묻는 질문</a>
                    </nav>
                </div>

                <div className="pricing-footer-bottom">
                    <p>
                        © {new Date().getFullYear()} WORKSPACE
                    </p>
                    <p>데모 페이지 · 실제 결제는 진행되지 않습니다.</p>
                </div>
            </div>
        </footer>
    );
}