export default function PricingCard({
    plan,
    billingCycle,
    isSelected,
    onSelect,
}) {
    const price =
        billingCycle === "annual"
            ? plan.annualMonthlyPrice
            : plan.monthlyPrice;

    return (
        <article
            className={`pricing-card ${plan.recommended ? "is-recommended" : ""
                }`}
        >
            {plan.recommended && (
                <span className="pricing-badge">추천 플랜</span>
            )}

            <h3>{plan.name}</h3>
            <p className="pricing-card-description">{plan.description}</p>

            <div className="pricing-price">
                <strong>{price.toLocaleString("ko-KR")}원</strong>
                <span> / 월</span>
            </div>

            <p className="pricing-billing-note">
                {price === 0
                    ? "무료로 이용"
                    : billingCycle === "annual"
                        ? `연 ${(price * 12).toLocaleString("ko-KR")}원 일시 결제`
                        : "매월 결제"}
            </p>

            <ul className="pricing-feature-list">
                {plan.features.map((feature) => (
                    <li key={feature}>
                        <span aria-hidden="true">✓</span> {feature}
                    </li>
                ))}
            </ul>

            <button
                type="button"
                className="pricing-select-button"
                aria-pressed={isSelected}
                onClick={() => onSelect(plan.id)}
            >
                {isSelected ? "선택됨" : "플랜 선택"}
            </button>
        </article>
    );
}