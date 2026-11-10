import { API_BASE } from '../../shared/config';
// 관리자 API는 로그인 시 발급된 토큰을 함께 보냅니다.
export async function adminRequest(path, options = {}) {
    // 로그인 때 저장된 토큰 (woojin/Login.js 가 nexus_auth_token 에 저장)
    const token = localStorage.getItem('nexus_auth_token');
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

// 견적 요청 목록 (전체, 최신순). 상태 필터는 화면에서 한다.
export function getQuoteRequests() {
    return adminRequest('/quote-requests');
}

// 견적 상태 변경 (접수 / 검토중 / 처리완료)
export function updateQuoteStatus(quoteId, status) {
    return adminRequest('/quote-requests/' + quoteId + '/status', {
        method: 'PATCH',
        body: JSON.stringify({ status }),
    });
}