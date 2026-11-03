const comparisonRows = [
    {
        feature: "이용 인원",
        free: "최대 3명",
        team: "최대 20명",
        business: "제한 없음",
    },
    {
        feature: "기본 일정 관리",
        free: true,
        team: true,
        business: true,
    },
    {
        feature: "프로젝트",
        free: "1개",
        team: "무제한",
        business: "무제한",
    },
    {
        feature: "휴가 관리",
        free: false,
        team: true,
        business: true,
    },
    {
        feature: "전자결재",
        free: false,
        team: true,
        business: true,
    },
    {
        feature: "관리자 권한 설정",
        free: false,
        team: false,
        business: true,
    },
    {
        feature: "업무 통계 및 보고서",
        free: false,
        team: false,
        business: true,
    },
    {
        feature: "우선 고객 지원",
        free: false,
        team: false,
        business: true,
    },
];

function FeatureValue({ value }) {
    if (typeof value === "boolean") {
        return (
            <span
                className={value ? "fc-supported" : "fc-unsupported"}
            >
                <span aria-hidden="true">{value ? "✓" : "—"}</span>
                <span className="fc-sr-only">
                    {value ? "제공" : "미제공"}
                </span>
            </span>
        );
    }

    return <span>{value}</span>;
}

export default function Fc() {
    return (
        <section
            id="features"
            className="fc-section"
            aria-labelledby="fc-title"
        >
            <div className="pricing-container">
                <div className="fc-heading">
                    <p className="fc-eyebrow">플랜 비교</p>
                    <h2 id="fc-title">필요한 기능을 한눈에 비교하세요</h2>
                    <p>우리 팀에 필요한 기능이 어떤 플랜에 포함되는지 확인하세요.</p>
                </div>

                <div
                    className="fc-table-scroll"
                    role="region"
                    aria-label="요금제별 기능 비교표"
                    tabIndex={0}
                >
                    <table className="fc-table">
                        <caption className="fc-sr-only">
                            Free, Team, Business 요금제별 제공 기능
                        </caption>

                        <thead>
                            <tr>
                                <th scope="col">기능</th>
                                <th scope="col">Free</th>
                                <th scope="col" className="fc-team-column">
                                    Team
                                    <span className="fc-recommend-label">추천</span>
                                </th>
                                <th scope="col">Business</th>
                            </tr>
                        </thead>

                        <tbody>
                            {comparisonRows.map((row) => (
                                <tr key={row.feature}>
                                    <th scope="row">{row.feature}</th>

                                    <td>
                                        <FeatureValue value={row.free} />
                                    </td>

                                    <td className="fc-team-column">
                                        <FeatureValue value={row.team} />
                                    </td>

                                    <td>
                                        <FeatureValue value={row.business} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <p className="fc-scroll-hint">
                    작은 화면에서는 표를 좌우로 밀어 확인하세요.
                </p>
            </div>
        </section>
    );
}