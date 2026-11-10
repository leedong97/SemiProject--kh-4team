import { useEffect, useRef, useState } from "react";
import { callApi } from "../shopAuth";

/**
 * 구글 로그인 버튼 (Google Identity Services)
 * 서버가 알려준 클라이언트 ID 가 없으면 버튼을 그리지 않아요.
 * onLogin(data): 서버 로그인 응답({ member, shopToken, needsNickname })을 부모에게 전달
 */
export default function GoogleButton({ onLogin, onError }) {
  const boxRef = useRef(null);
  const onLoginRef = useRef(onLogin);
  const onErrorRef = useRef(onError);
  const [ready, setReady] = useState(false);

  useEffect(() => { onLoginRef.current = onLogin; onErrorRef.current = onError; });

  useEffect(() => {
    let cancelled = false;

    const draw = (clientId) => {
      if (cancelled || !window.google || !boxRef.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response) => {
          const { data } = await callApi("/api/shop/auth/google", { method: "POST", body: { credential: response.credential } });
          if (data.ok) onLoginRef.current(data);
          else onErrorRef.current(data.message || "구글 로그인에 실패했어요.");
        },
      });
      window.google.accounts.id.renderButton(boxRef.current, { theme: "outline", size: "large", width: 320, text: "continue_with", locale: "ko" });
      setReady(true);
    };

    (async () => {
      const { data } = await callApi("/api/shop/auth/google-config");
      if (cancelled || !data.clientId) return;
      if (window.google && window.google.accounts) { draw(data.clientId); return; }
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.onload = () => draw(data.clientId);
      document.head.appendChild(script);
    })();

    return () => { cancelled = true; };
  }, []);

  return <div className="shop-auth-google" ref={boxRef} style={ready ? undefined : { display: "none" }} />;
}
