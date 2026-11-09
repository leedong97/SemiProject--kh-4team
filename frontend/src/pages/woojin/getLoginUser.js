import dummyUser from "../../shared/user";

// 로그인한 직원 정보를 브라우저(sessionStorage)에 보관해요.
// 왜 sessionStorage? 새로고침(F5)이나 페이지 이동에는 값이 남지만, 탭/창을 닫으면 사라져서
// 다시 열면 로그인을 새로 해야 해요. (localStorage 는 창을 닫아도 계속 남아요)
// (서버가 돌려준 직원 정보만 저장하고, 비밀번호는 저장하지 않아요. 서버가 아예 보내지 않아요.)
const KEY = "erpUser";

// 로그인 성공 직후 호출: 서버가 준 직원 정보(DB 컬럼 이름 그대로)를 저장
export function saveLoginUser(dbUser) {
    sessionStorage.setItem(KEY, JSON.stringify(dbUser));
    localStorage.removeItem(KEY); // 예전 방식으로 남은 로그인 정보 정리
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
        const raw = sessionStorage.getItem(KEY);
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

// 페이지가 처음 열릴 때 딱 한 번 실행: 로그인 정보가 없으면 남아 있던 토큰/예전 로그인도 같이 정리
// 왜? 창을 닫으면 erpUser 는 사라지지만 팀원 코드가 읽는 토큰(localStorage)은 남기 때문이에요.
try {
    if (!sessionStorage.getItem(KEY)) clearLoginUser();
} catch (e) { /* 저장소를 못 쓰면 그냥 넘어가요 */ }

export default getLoginUser;
