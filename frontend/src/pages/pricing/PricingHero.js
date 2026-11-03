import { Link } from "react-router-dom";

export default function PricingHero() {
    return (
        <section className="pricing-hero">
            <div className="pricing-container">
                <p className="pricing-eyebrow">
                    팀을 위한 업무 관리 서비스
                </p>

                <h1>
                    우리 팀에 맞는 플랜으로
                    <br />
                    더 편리하게 일하세요
                </h1>

                <p className="pricing-description">
                    일정부터 프로젝트, 전자결재까지.
                    <br />
                    팀의 규모와 필요한 기능에 맞춰 시작하세요.
                </p>

                <div className="pricing-hero-actions">
                    <a href="#plans" className="pricing-primary-button">
                        요금제 살펴보기
                    </a>

                    <Link to="/preview" className="pricing-demo-button">
                        데모 체험하기 →
                    </Link>
                </div>
            </div>
        </section>
    );
}