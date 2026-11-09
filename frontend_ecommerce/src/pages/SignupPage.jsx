import { useState } from "react";
import Breadcrumb from "../components/Breadcrumb";
import NicknameField from "../components/NicknameField";
import { callApi } from "../shopAuth";

/**
 * 일반 회원가입 화면
 * 닉네임은 "중복확인"을 통과해야 가입 버튼이 눌려요. (서버가 마지막에 한 번 더 검사)
 * onSignedUp: 가입 성공 후 로그인 화면으로 이동시키는 함수
 */
export default function SignupPage({ onSignedUp, onNavigate }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [nickname, setNickname] = useState("");
  const [checkedNickname, setCheckedNickname] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMsg("");
    if (password.length < 8) return setErrorMsg("비밀번호는 8자 이상이어야 해요.");
    if (password !== password2) return setErrorMsg("비밀번호가 서로 달라요.");
    if (checkedNickname === null || checkedNickname !== nickname.trim()) return setErrorMsg("닉네임 중복확인을 먼저 해 주세요.");

    setLoading(true);
    const { data } = await callApi("/api/shop/auth/signup", {
      method: "POST",
      body: { name, email, phone, nickname: nickname.trim(), password },
    });
    setLoading(false);
    if (data.ok) {
      onSignedUp(email);
    } else {
      setErrorMsg(data.message || "회원가입에 실패했어요.");
      // 그 사이 다른 사람이 같은 닉네임을 가져갔다면 다시 확인하도록 되돌린다
      if (/닉네임/.test(data.message || "")) setCheckedNickname(null);
    }
  };

  return (
    <div className="shell">
      <Breadcrumb onHome={() => onNavigate("home")}>회원가입</Breadcrumb>
      <div className="shop-auth-card">
        <h1>회원가입</h1>
        <p className="muted">이메일로 가입하면 견적 내역을 계정에서 관리할 수 있어요.</p>

        <form onSubmit={handleSubmit} className="shop-auth-form">
          <div className="field">
            <label htmlFor="shop-signup-name">이름 *</label>
            <input id="shop-signup-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={50} required autoComplete="name" />
          </div>
          <NicknameField value={nickname} onChange={setNickname} checkedValue={checkedNickname} onChecked={setCheckedNickname} />
          <div className="field">
            <label htmlFor="shop-signup-email">이메일 *</label>
            <input id="shop-signup-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </div>
          <div className="field">
            <label htmlFor="shop-signup-phone">전화번호</label>
            <input id="shop-signup-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-1234-5678" autoComplete="tel" />
          </div>
          <div className="field">
            <label htmlFor="shop-signup-pw">비밀번호 * (8자 이상)</label>
            <input id="shop-signup-pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" />
          </div>
          <div className="field">
            <label htmlFor="shop-signup-pw2">비밀번호 확인 *</label>
            <input id="shop-signup-pw2" type="password" value={password2} onChange={(e) => setPassword2(e.target.value)} required autoComplete="new-password" />
          </div>
          {errorMsg && <p className="shop-auth-error" role="alert">{errorMsg}</p>}
          <button className="btn shop-auth-submit" type="submit" disabled={loading}>
            {loading ? "가입 중…" : "가입하기"}
          </button>
        </form>

        <p className="shop-auth-switch">
          이미 회원이신가요?{" "}
          <button type="button" className="shop-auth-link" onClick={() => onNavigate("login")}>로그인</button>
        </p>
      </div>
    </div>
  );
}
