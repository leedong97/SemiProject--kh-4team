// API 서버 주소: 개발은 localhost:3333, 배포는 현재 사이트의 /api를 사용합니다.
// REACT_APP_API_URL은 빌드 시 적용되는 서버 주소입니다. 통합 배포에서는 비워 두세요.
export const API_BASE = (process.env.REACT_APP_API_URL?.trim() ||
  (process.env.NODE_ENV === 'development' ? 'http://localhost:3333' : '')
).replace(/\/+$/, '');
