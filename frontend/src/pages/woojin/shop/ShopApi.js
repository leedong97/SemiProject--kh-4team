import { API_BASE } from "../../../shared/config";

//토큰 과 고객 key
const SHOP_AUTH_TOKEN_KEY = "shop_token_key";
const SHOP_MEMBER_KEY = "shop_member_key";

//토큰생성
export function saveShopToken(token) {
    localStorage.setItem(SHOP_AUTH_TOKEN_KEY, token);
}

export function getShopToken() {
    return localStorage.getItem(SHOP_AUTH_TOKEN_KEY);
}

export function clearShopToken() {
    localStorage.removeItem(SHOP_AUTH_TOKEN_KEY);
}
//고객생성
export function saveShopMember(member) {
    localStorage.setItem(SHOP_MEMBER_KEY, JSON.stringify(member));
}

export function getShopMember() {

    try {
        const raw = localStorage.getItem(SHOP_MEMBER_KEY);
        if (raw === null) {
            return null;
        }
        return JSON.parse(raw);
    } catch (err) {
        console.error(err);
        return null;
    }

}

export function clearShopMember() {
    localStorage.removeItem(SHOP_MEMBER_KEY);
}

//로그인 상태 확인
export function isShopLoggedIn() {
    return getShopToken() !== null;

}

// 로그아웃
export function logoutShop() {
    clearShopToken();
    clearShopMember();
}

