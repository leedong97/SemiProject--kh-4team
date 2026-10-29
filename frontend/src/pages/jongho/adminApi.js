// 관리자 API는 로그인 시 발급된 토큰을 함께 보냅니다.
export async function adminRequest(path, options = {}) {
    const token = sessionStorage.getItem('nexus_token');
    const response = await fetch('http://localhost:3333/api/admin' + path, {
        ...options,
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + (token || ''), ...options.headers }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || '서버 요청 실패 (' + response.status + ')');
    return data;
}
