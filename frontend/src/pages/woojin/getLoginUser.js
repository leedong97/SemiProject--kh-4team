import dummyUser from "../../shared/user";

// 로그인한 직원 정보를 브라우저(localStorage)에 보관해요.
// 왜 localStorage? 페이지를 옮기거나 새로고침해도 값이 남아서, 마이페이지가 다시 꺼내 쓸 수 있어요.
// (서버가 돌려준 직원 정보만 저장하고, 비밀번호는 저장하지 않아요. 서버가 아예 보내지 않아요.)
const KEY = "erpUser";

// 로그인 성공 직후 호출: 서버가 준 직원 정보(DB 컬럼 이름 그대로)를 저장
export function saveLoginUser(dbUser) {
    localStorage.setItem(KEY, JSON.stringify(dbUser));
}

// 로그아웃할 때 호출: 저장한 정보를 지워요
export function clearLoginUser() {
    localStorage.removeItem(KEY);
}

// 마이페이지가 쓰는 모양(name, rank, division, team, empNo, role)으로 바꿔서 돌려줘요.
// 로그인 정보가 없으면(주소로 바로 들어온 경우) 예전처럼 shared/user.js 더미를 써요. isDummy: true
function getLoginUser() {
    try {
        const raw = localStorage.getItem(KEY);
        if (raw) {
            const u = JSON.parse(raw);
            return {
                id: u.employee_id,
                name: u.employee_name,
                rank: u.employee_grade,
                division: u.employee_division,
                team: u.employee_team,
                empNo: u.employee_code,
                role: u.employee_role,
                isDummy: false,
            };
        }
    } catch (e) {
        // 저장된 값이 깨졌거나 localStorage 를 못 쓰는 경우 -> 더미로 계속 진행
    }
    return { ...dummyUser, isDummy: true };
}

export default getLoginUser;
