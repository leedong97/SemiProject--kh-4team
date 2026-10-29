export default function BillingToggle({ billingCycle, onChange }) {
    return (
        <div className="pricing-toggle" role="group" aria-label="결제 주기">
            <button
                type="button"
                className={billingCycle === "monthly" ? "is-active" : ""}
                aria-pressed={billingCycle === "monthly"}
                onClick={() => onChange("monthly")}
            >
                월간
            </button>

            <button
                type="button"
                className={billingCycle === "annual" ? "is-active" : ""}
                aria-pressed={billingCycle === "annual"}
                onClick={() => onChange("annual")}
            >
                연간 <span>20% 할인</span>
            </button>
        </div>
    );
}