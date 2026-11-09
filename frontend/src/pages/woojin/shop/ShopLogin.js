import { useEffect, useRef, useState } from "react";
import { API_BASE } from "../../../shared/config";
import { saveShopToken, saveShopMember } from "./ShopApi";
import "./ShopLogin.css";

// 쇼핑몰 고객 로그인 (이메일+비밀번호 / 구글)
// 사용법:  <ShopLogin onSuccess={(member) => 로그인 뒤 할 일} onSignupClick={() => 회원가입 화면으로} />
// 서버와는 fetch 로 통신해요. (axios 가 없는 프로젝트(이커머스)에 붙여도 추가 설치가 필요 없어요)

const AUTH_URL = API_BASE + "/api/shop/auth";
const GOOGLE_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

// 구글 로그인 스크립트를 한 번만 불러온다
function loadGoogleScript() {
    return new Promise((resolve, reject) => {
        if (window.google && window.google.accounts && window.google.accounts.id) {
            resolve();
            return;
        }
        const existing = document.querySelector('script[src="' + GOOGLE_SCRIPT_SRC + '"]');
        if (existing) {
            existing.addEventListener("load", () => resolve());
            existing.addEventListener("error", () => reject(new Error("구글 스크립트를 불러오지 못했어요.")));
            return;
        }
        const script = document.createElement("script");
        script.src = GOOGLE_SCRIPT_SRC;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("구글 스크립트를 불러오지 못했어요."));
        document.head.appendChild(script);
    });
}

// 서버에 JSON 을 보내고, 실패하면 화면에 보여줄 메시지를 담은 Error 를 던진다
async function postJson(path, body) {
    let response;
    try {
        response = await fetch(AUTH_URL + path, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
    } catch (networkError) {
        // 서버가 꺼져 있거나 주소가 틀리면 여기로 와요 (response 자체가 없음)
        throw new Error("서버에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.");
    }
    let data = null;
    try {
        data = await response.json();
    } catch (parseError) {
        data = null;
    }
    if (!response.ok || !data || !data.ok) {
        throw new Error((data && data.message) || "로그인에 실패했어요.");
    }
    return data;
}

function ShopLogin({ onSuccess, onSignupClick }) {
    const [shopEmail, setShopEmail] = useState("");
    const [shopPw, setShopPw] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [loading, setLoading] = useState(false);
    const [googleReady, setGoogleReady] = useState(false);

    const googleBtnRef = useRef(null);
    // 구글 콜백은 처음 한 번만 등록되므로, 최신 onSuccess 를 ref 에 담아 둔다
    const onSuccessRef = useRef(onSuccess);
    onSuccessRef.current = onSuccess;

    // 로그인 성공 공통 처리: 토큰·회원 정보 저장 -> 부모에게 알림
    function finishLogin(data) {
        saveShopToken(data.shopToken);
        saveShopMember(data.member);
        if (typeof onSuccessRef.current === "function") {
            onSuccessRef.current(data.member);
        }
    }

    async function handleSubmit(e) {
        e.preventDefault(); // 폼 기본 동작(페이지 새로고침) 막기
        if (loading) return;

        const email = shopEmail.trim();
        if (!email || !shopPw) {
            setErrorMsg("이메일과 비밀번호를 입력해 주세요.");
            return;
        }
        setLoading(true);
        setErrorMsg("");
        try {
            const data = await postJson("/login", { email: email, password: shopPw });
            finishLogin(data);
        } catch (err) {
            setErrorMsg(err.message);
        } finally {
            setLoading(false);
        }
    }

    // 구글이 로그인에 성공하면 credential(ID 토큰)을 넘겨줘요 -> 서버가 진짜인지 확인
    async function handleGoogleCredential(response) {
        setLoading(true);
        setErrorMsg("");
        try {
            const data = await postJson("/google", { credential: response.credential });
            finishLogin(data);
        } catch (err) {
            setErrorMsg(err.message);
        } finally {
            setLoading(false);
        }
    }

    // 화면이 뜨면 구글 버튼 준비 (서버에 클라이언트 ID 가 설정돼 있을 때만 버튼을 보여줘요)
    useEffect(() => {
        let cancelled = false;

        async function setupGoogle() {
            try {
                const configResponse = await fetch(AUTH_URL + "/google-config");
                const config = await configResponse.json();
                if (!config || !config.clientId) return; // 설정 전이면 버튼 없이 일반 로그인만

                await loadGoogleScript();
                if (cancelled || !googleBtnRef.current) return;

                window.google.accounts.id.initialize({
                    client_id: config.clientId,
                    callback: handleGoogleCredential,
                });
                window.google.accounts.id.renderButton(googleBtnRef.current, {
                    theme: "outline",
                    size: "large",
                    text: "continue_with",
                    shape: "rectangular",
                    width: 320,
                    locale: "ko",
                });
                setGoogleReady(true);
            } catch (err) {
                // 구글 쪽이 실패해도 일반 로그인은 계속 쓸 수 있어야 해요
                console.error("구글 로그인 준비 실패:", err.message);
            }
        }

        setupGoogle();
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="shop-login-wrap">
            <form className="shop-login-card" onSubmit={handleSubmit} noValidate>
                <h2 className="shop-login-title">로그인</h2>

                <label className="shop-login-label" htmlFor="shop-login-email">이메일</label>
                <input
                    id="shop-login-email"
                    className="shop-login-input"
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={shopEmail}
                    onChange={(e) => setShopEmail(e.target.value)}
                    placeholder="이메일을 입력하세요"
                    disabled={loading}
                />

                <label className="shop-login-label" htmlFor="shop-login-pw">비밀번호</label>
                <input
                    id="shop-login-pw"
                    className="shop-login-input"
                    type="password"
                    name="password"
                    autoComplete="current-password"
                    value={shopPw}
                    onChange={(e) => setShopPw(e.target.value)}
                    placeholder="비밀번호를 입력하세요"
                    disabled={loading}
                />

                {errorMsg && (
                    <p className="shop-login-error" role="alert">{errorMsg}</p>
                )}

                <button className="shop-login-submit" type="submit" disabled={loading}>
                    {loading ? "확인 중..." : "로그인"}
                </button>

                {googleReady && <div className="shop-login-divider"><span>또는</span></div>}
                {/* 구글 버튼이 그려질 자리 (항상 렌더링해 둬야 ref 가 잡혀요) */}
                <div className="shop-login-google" ref={googleBtnRef}></div>

                {typeof onSignupClick === "function" && (
                    <p className="shop-login-foot">
                        아직 회원이 아니신가요?{" "}
                        <button type="button" className="shop-login-link" onClick={onSignupClick}>회원가입</button>
                    </p>
                )}
            </form>
        </div>
    );
}

export default ShopLogin;
