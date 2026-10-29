import { useState } from "react";
import BillingToggle from "./BillingToggle";
import PricingCard from "./PricingCard";

const plans = [
    {
        id: "free",
        name: "Free",
        description: "가볍게 시작하는 개인과 작은 팀",
        monthlyPrice: 0,
        annualMonthlyPrice: 0,
        recommended: false,
        features: [
            "최대 3명 이용",
            "기본 일정 관리",
            "프로젝트 1개",
        ],
    },
    {
        id: "team",
        name: "Team",
        description: "함께 일하는 팀을 위한 업무 관리",
        monthlyPrice: 30000,
        annualMonthlyPrice: 24000,
        recommended: true,
        features: [
            "최대 20명 이용",
            "일정 및 휴가 관리",
            "프로젝트 무제한",
            "전자결재",
        ],
    },
    {
        id: "business",
        name: "Business",
        description: "조직 전체를 위한 통합 관리",
        monthlyPrice: 60000,
        annualMonthlyPrice: 48000,
        recommended: false,
        features: [
            "인원 제한 없음",
            "Team의 모든 기능",
            "관리자 권한 설정",
            "업무 통계 및 보고서",
            "우선 고객 지원",
        ],
    },
];

export default function PricingSection() {
    const [billingCycle, setBillingCycle] = useState("monthly");
    const [selectedPlanId, setSelectedPlanId] = useState(null);

    const selectedPlan = plans.find(
        (plan) => plan.id === selectedPlanId
    );

    return (
        <section id="plans" className="pricing-plans">
            <div className="pricing-container">
                <h2 className="pricing-section-title">
                    우리 팀에 맞는 요금제
                </h2>

                <BillingToggle
                    billingCycle={billingCycle}
                    onChange={setBillingCycle}
                />

                <div className="pricing-card-grid">
                    {plans.map((plan) => (
                        <PricingCard
                            key={plan.id}
                            plan={plan}
                            billingCycle={billingCycle}
                            isSelected={selectedPlanId === plan.id}
                            onSelect={setSelectedPlanId}
                        />
                    ))}
                </div>

                <p className="pricing-selection-message" role="status">
                    {selectedPlan
                        ? `${selectedPlan.name} 플랜을 선택했어요. 아직 결제되지 않습니다.`
                        : "필요한 기능에 맞는 플랜을 선택하세요."}
                </p>
            </div>
        </section>
    );
}