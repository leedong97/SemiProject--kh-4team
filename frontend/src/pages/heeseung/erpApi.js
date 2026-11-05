import { API_BASE } from '../../shared/config';

// 직원 ID는 요청 본문에서 받지 않습니다. 서버가 서명 토큰으로 로그인자를 확인합니다.
export async function erpRequest(path, method = 'GET', body) {
    const token = sessionStorage.getItem('erpAuthToken');
    if (!token) throw new Error('로그인이 필요합니다. 로그아웃 후 다시 로그인하세요.');
    const response = await fetch(API_BASE + '/api/heeseung' + path, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        body: body === undefined ? undefined : JSON.stringify(body)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || '서버 저장 실패');
    return result;
}
