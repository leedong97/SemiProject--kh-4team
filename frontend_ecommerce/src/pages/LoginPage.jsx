import { useState } from "react";
import Breadcrumb from "../components/Breadcrumb";
import GoogleButton from "../components/GoogleButton";
import { callApi, EMAIL_PATTERN, EMAIL_RULE } from "../shopAuth";

/**
 * 로그인 화면 (이메일/비밀번호 + 구글)
 * onLoggedIn(data): 성공하면 App 에게 { member, shopToken, needsNickname } 전달
 */
export default function LoginPage({ onLoggedIn, onNavigate }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMsg("");
    if (!EMAIL_PATTERN.test(email.trim())) return setErrorMsg(EMAIL_RULE);
    setLoading(true);
    const { data } = await callApi("/api/shop/auth/login", { method: "POST", body: { email: email.trim(), password } });
    setLoading(false);
    if (data.ok) onLoggedIn(data);
    else setErrorMsg(data.message || "로그인에 실패했어요.");
  };

  return (
    <div className="shell">
      <Breadcrumb onHome={() => onNavigate("home")}>로그인</Breadcrumb>
      <div className="shop-auth-card">
        <h1>로그인</h1>
        <p className="muted">ZERYN 고객 계정으로 로그인해요.</p>

        <form onSubmit={handleSubmit} className="shop-auth-form">
          <div className="field">
            <label htmlFor="shop-login-email">이메일</label>
            <input id="shop-login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </div>
          <div className="field">
            <label htmlFor="shop-login-pw">비밀번호</label>
            <input id="shop-login-pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
          </div>
          {errorMsg && <p className="shop-auth-error" role="alert">{errorMsg}</p>}
          <button className="btn shop-auth-submit" type="submit" disabled={loading}>
            {loading ? "로그인 중…" : "로그인"}
          </button>
        </form>

        <div className="shop-auth-divider"><span>또는</span></div>
        <GoogleButton onLogin={onLoggedIn} onError={setErrorMsg} />

        <p className="shop-auth-switch">
          아직 회원이 아니신가요?{" "}
          <button type="button" className="shop-auth-link" onClick={() => onNavigate("signup")}>회원가입</button>
        </p>
      </div>
    </div>
  );
}
