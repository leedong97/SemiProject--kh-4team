// 서버 주소를 한 곳에서 관리합니다. (포트가 바뀌면 여기 또는 frontend/.env 한 곳만 수정)
// frontend/.env 에 REACT_APP_API_URL=http://localhost:3333 을 쓰면 그 값이 우선이에요.
export const API_BASE = (process.env.REACT_APP_API_URL || 'http://localhost:3333').replace(/\/$/, '');
