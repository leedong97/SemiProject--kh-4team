import dummyUser from "../../shared/user";

// 로그인한 직원 정보를 localStorage에 저장해 같은 출처의 탭에서 공유합니다.
// 탭을 닫아도 정보가 남으며, 실제 인증 여부는 서버가 토큰으로 확인합니다.
// 비밀번호는 저장하지 않습니다.
const KEY = "erpUser";

// 로그인 성공 후 직원 정보를 저장하고, 이전 sessionStorage 값은 정리합니다.
export function saveLoginUser(dbUser) {
    localStorage.setItem(KEY, JSON.stringify(dbUser));
    sessionStorage.removeItem(KEY);
}

// 로그아웃할 때 호출: 저장한 정보를 지워요
export function clearLoginUser() {
    sessionStorage.removeItem(KEY);
    localStorage.removeItem(KEY);
    localStorage.removeItem('communityToken');
    localStorage.removeItem('nexus_auth_token');
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
        // 저장된 값이 깨졌거나 sessionStorage 를 못 쓰는 경우 -> 더미로 계속 진행
    }
    return { ...dummyUser, isDummy: true };
}



export default getLoginUser;
