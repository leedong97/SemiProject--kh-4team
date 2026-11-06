export default function PricingHeader() {
    return (
        <header className="pricing-header">
            <div className="pricing-container pricing-header-inner">
                <a href="#plans" className="pricing-logo">
                    COMMAND ERP
                </a>

                <nav className="pricing-nav" aria-label="메인 메뉴">
                    <a href="#plans">요금제</a>
                    <a href="#features">기능 비교</a>
                    <a href="#faq">자주 묻는 질문</a>
                </nav>
            </div>
        </header>
    );
}