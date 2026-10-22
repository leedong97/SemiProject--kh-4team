// 실제 직원 정보가 아닌 연습용 샘플 데이터입니다.
export const initialData = {
    employees: [
        { id: 1, name: "김민수", team: "개발팀", position: "백엔드", role: "백엔드", status: "재직" },
        { id: 2, name: "이서연", team: "개발팀", position: "프론트엔드", role: "프론트엔드", status: "재직" },
        { id: 3, name: "박지훈", team: "개발팀", position: "풀스택", role: "풀스택", status: "재직" }
    ],
    issues: [
        { id: 1, title: "로그인 API 오류", assigneeId: 1, priority: "긴급", status: "진행 중", due: "2026-11-01", comments: ["오류 재현 확인"], history: [] },
        { id: 2, title: "모바일 화면 깨짐", assigneeId: 2, priority: "보통", status: "검토 중", due: "2026-11-05", comments: [], history: [] }
    ],
    evaluations: [],
    leaves: [],
    logs: []
};
