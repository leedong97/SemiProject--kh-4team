import { API_BASE } from '../../shared/config';
import { PROJECT_STATUS } from './shared/projectConstants';
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

// 완료 요청 목록을 만든다 (조회는 하지 않는다: Context가 받은 목록을 넘긴다)
// 1) 요청 기록(project_requests)이 있는 것은 요청자·날짜 등 기록을 그대로 쓴다
// 2) 요청 기록 없이 상태만 '완료 요청'인 프로젝트를 뒤에 붙인다 (기록이 있는 프로젝트는 중복하지 않는다)
export function buildCompletionRequests(requests, projects) {
    const requestList = Array.isArray(requests) ? requests : [];
    const projectList = Array.isArray(projects) ? projects : [];
    const covered = new Set(requestList.map((r) => String(r.projectId)));
    const statusOnly = projectList
        .filter((p) => p.status === PROJECT_STATUS.REQUESTED && !covered.has(String(p.id)))
        .map((p) => ({
            id: 'status-' + p.id,
            type: '완료',
            projectId: p.id,
            projectName: p.name,
            title: p.name,
            requesterName: p.customer || '',
            requestedAt: '',
        }));
    return [...requestList, ...statusOnly];
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