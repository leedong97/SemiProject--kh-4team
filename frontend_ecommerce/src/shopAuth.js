// 쇼핑몰 고객 인증 도우미: 서버 주소, 서버 호출(fetch), 로그인 정보 저장(localStorage)
export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3333";

const TOKEN_KEY = "shop_token_key";
const MEMBER_KEY = "shop_member_key";

export function saveSession(shopToken, member) {
  try {
    localStorage.setItem(TOKEN_KEY, shopToken);
    localStorage.setItem(MEMBER_KEY, JSON.stringify(member));
  } catch (e) { /* 저장소가 막혀 있어도 화면은 동작해야 함 */ }
}

export function saveMember(member) {
  try { localStorage.setItem(MEMBER_KEY, JSON.stringify(member)); } catch (e) { /* 무시 */ }
}

export function getToken() {
  try { return localStorage.getItem(TOKEN_KEY) || ""; } catch (e) { return ""; }
}

export function getSavedMember() {
  try {
    const raw = localStorage.getItem(MEMBER_KEY);
    return getToken() && raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

export function clearSession() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(MEMBER_KEY);
  } catch (e) { /* 무시 */ }
}

// 서버 호출 공통 함수. 항상 { status, data } 를 돌려주고, 서버가 꺼져 있으면 친절한 메시지를 준다.
export async function callApi(path, { method = "GET", body, auth = false } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) headers.Authorization = "Bearer " + getToken();
  try {
    const res = await fetch(API_BASE + path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  } catch (e) {
    return { status: 0, data: { ok: false, message: "서버에 연결할 수 없어요. 백엔드(3333)가 켜져 있는지 확인해 주세요." } };
  }
}

export const NICKNAME_RULE = "2~12자, 한글·영문·숫자·_ 만 가능해요.";
export const NICKNAME_PATTERN = /^[가-힣A-Za-z0-9_]{2,12}$/;
