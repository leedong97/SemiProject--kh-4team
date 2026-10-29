import { useId, useState } from "react";

const faqs = [
    {
        id: "free",
        question: "무료 플랜으로 어떤 기능을 사용할 수 있나요?",
        answer:
            "Free 플랜에서는 최대 3명이 기본 일정 관리와 프로젝트 1개를 사용할 수 있습니다.",
    },
    {
        id: "billing",
        question: "월간 결제와 연간 결제는 어떻게 다른가요?",
        answer:
            "월간 플랜은 매월 결제합니다. 연간 플랜은 20% 할인된 월 환산 금액으로 표시되며, 12개월 요금을 한 번에 결제하는 구성입니다.",
    },
    {
        id: "team",
        question: "전자결재와 휴가 관리는 어떤 플랜에서 제공되나요?",
        answer:
            "Team과 Business 플랜에서 사용할 수 있습니다. Free 플랜에는 포함되지 않습니다.",
    },
    {
        id: "business",
        question: "20명보다 많은 팀원도 사용할 수 있나요?",
        answer:
            "현재 예시 요금제에서는 인원 제한이 없는 Business 플랜을 선택하면 됩니다.",
    },
    {
        id: "payment",
        question: "플랜 선택을 누르면 바로 결제되나요?",
        answer:
            "아니요. 현재 페이지는 데모 화면으로, 선택한 플랜만 표시합니다. 실제 결제는 진행되지 않습니다.",
    },
];

export default function FaqSection() {
    const [openId, setOpenId] = useState(null);
    const sectionId = useId();

    function toggleQuestion(id) {
        setOpenId((previousId) => (previousId === id ? null : id));
    }

    return (
        <section
            id="faq"
            className="pricing-faq"
            aria-labelledby={`${sectionId}-title`}
        >
            <div className="pricing-container">
                <div className="pricing-faq-heading">
                    <p className="pricing-eyebrow">FAQ</p>
                    <h2 id={`${sectionId}-title`}>자주 묻는 질문</h2>
                    <p>서비스 이용 전에 궁금한 내용을 확인하세요.</p>
                </div>

                <div className="pricing-faq-list">
                    {faqs.map((faq) => {
                        const isOpen = openId === faq.id;
                        const questionId = `${sectionId}-${faq.id}-question`;
                        const answerId = `${sectionId}-${faq.id}-answer`;

                        return (
                            <div
                                key={faq.id}
                                className={`pricing-faq-item ${isOpen ? "is-open" : ""
                                    }`}
                            >
                                <h3 className="pricing-faq-question">
                                    <button
                                        id={questionId}
                                        type="button"
                                        aria-expanded={isOpen}
                                        aria-controls={answerId}
                                        onClick={() => toggleQuestion(faq.id)}
                                    >
                                        <span>{faq.question}</span>
                                        <span className="pricing-faq-icon" aria-hidden="true">
                                            {isOpen ? "−" : "+"}
                                        </span>
                                    </button>
                                </h3>

                                <div
                                    id={answerId}
                                    className="pricing-faq-answer"
                                    role="region"
                                    aria-labelledby={questionId}
                                    hidden={!isOpen}
                                >
                                    <p>{faq.answer}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}