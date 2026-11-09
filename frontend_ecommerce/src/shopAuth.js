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

// 이메일 형식 검사 (화면과 서버가 같은 규칙을 써요). 예: name@example.com
export const EMAIL_RULE = "이메일 형식으로 입력해 주세요. 예: name@example.com";
export const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

// 전화번호: 숫자만 쳐도 010-1234-5678 모양으로 맞춰 줘요 (최대 11자리)
export const PHONE_RULE = "전화번호는 010-1234-5678 형식으로 입력해 주세요.";
export const PHONE_PATTERN = /^01[016789]-\d{3,4}-\d{4}$/;
export function formatPhone(value) {
  const d = String(value || "").replace(/\D/g, "").slice(0, 11);
  if (d.length < 4) return d;
  if (d.length < 8) return d.slice(0, 3) + "-" + d.slice(3);
  if (d.length === 11) return d.slice(0, 3) + "-" + d.slice(3, 7) + "-" + d.slice(7);
  return d.slice(0, 3) + "-" + d.slice(3, 6) + "-" + d.slice(6);
}
