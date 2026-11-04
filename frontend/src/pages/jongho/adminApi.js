import { API_BASE } from '../../shared/config';
// 관리자 API는 로그인 시 발급된 토큰을 함께 보냅니다.
export async function adminRequest(path, options = {}) {
    // 로그인 화면에서 저장한 토큰과 같은 키를 사용합니다.
    const token = localStorage.getItem('nexus_auth_token') || sessionStorage.getItem('nexus_token');
    const response = await fetch(`${API_BASE}/api/admin` + path, {
        ...options,
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + (token || ''), ...options.headers }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || '서버 요청 실패 (' + response.status + ')');
    return data;
}

export function getPendingProjectRequests(type) {
    const query = new URLSearchParams({ status: '대기' });
    if (type) query.set('type', type);
    return adminRequest('/project-requests?' + query.toString());
}
