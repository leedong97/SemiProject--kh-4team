// 직무(position)와 직급(rank)은 별개입니다. 팀장 이상만 책임자·평가자로 지정합니다.
export function canLeadProject(employee) {
    return ["팀장", "실장", "부장", "이사", "상무", "전무", "대표", "관리자"].includes(employee?.rank);
}
