import dummyUser from "../../shared/user";

// 로그인 정보 보관·조회 (localStorage)
const KEY = "erpUser";

export function saveLoginUser(dbUser) {
    localStorage.setItem(KEY, JSON.stringify(dbUser));
}

export function clearLoginUser() {
    localStorage.removeItem(KEY);
}

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
    }
    return { ...dummyUser, isDummy: true };
}

export default getLoginUser;
