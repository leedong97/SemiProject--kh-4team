import { useState } from "react";
import Breadcrumb from "../components/Breadcrumb";
import NicknameField from "../components/NicknameField";
import { callApi, PHONE_PATTERN, PHONE_RULE, formatPhone } from "../shopAuth";

/**
 * 닉네임 설정 화면: 구글로 처음 로그인했거나, 닉네임이 없는 옛 계정일 때 보여줘요.
 * onSaved(member): 저장 성공 시 갱신된 회원 정보를 App 에게 전달
 */
export default function NicknamePage({ member, onSaved, onNavigate }) {
  const [nickname, setNickname] = useState("");
  const [checkedNickname, setCheckedNickname] = useState(null);
  const [name, setName] = useState(member ? member.name || "" : ""); // 구글이 알려 준 이름으로 미리 채워 둬요
  const [phone, setPhone] = useState("");
  const [phoneMsg, setPhoneMsg] = useState("");
  const [phoneOk, setPhoneOk] = useState(true); // 비워 두면(선택 입력) 통과
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // 전화번호 칸을 벗어날 때: 형식 확인 + 서버에 중복 확인 (일반 가입 화면과 같은 규칙)
  const checkPhone = async () => {
    if (!phone) { setPhoneMsg(""); setPhoneOk(true); return; }
    if (!PHONE_PATTERN.test(phone)) { setPhoneMsg(PHONE_RULE); setPhoneOk(false); return; }
    const { data } = await callApi("/api/shop/auth/phone-check?phone=" + encodeURIComponent(phone));
    const available = data.ok === true && data.available === true;
    setPhoneOk(available);
    setPhoneMsg(data.message || (available ? "사용할 수 있어요." : "확인에 실패했어요."));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMsg("");
    if (!name.trim()) return setErrorMsg("이름을 입력해 주세요.");
    if (checkedNickname === null || checkedNickname !== nickname.trim()) return setErrorMsg("닉네임 중복확인을 먼저 해 주세요.");
    if (phone && !PHONE_PATTERN.test(phone)) return setErrorMsg(PHONE_RULE);
    if (phone && !phoneOk) return setErrorMsg(phoneMsg || "전화번호를 확인해 주세요.");
    setLoading(true);
    const { data } = await callApi("/api/shop/auth/nickname", { method: "PATCH", auth: true, body: { nickname: nickname.trim(), name: name.trim(), phone } });
    setLoading(false);
    if (data.ok) onSaved(data.member);
    else {
      setErrorMsg(data.message || "닉네임 저장에 실패했어요.");
      if (/전화번호/.test(data.message || "")) { setPhoneOk(false); setPhoneMsg(data.message); }
      else setCheckedNickname(null);
    }
  };

  return (
    <div className="shell">
      <Breadcrumb onHome={() => onNavigate("home")}>닉네임 설정</Breadcrumb>
      <div className="shop-auth-card">
        <h1>닉네임을 정해 주세요</h1>
        <p className="muted">{member ? member.name + "님, " : ""}처음 오셨네요! 이름을 확인하고 서비스에서 보일 닉네임을 정하면 시작할 수 있어요. 전화번호는 비워 두셔도 돼요.</p>
        <form onSubmit={handleSubmit} className="shop-auth-form">
          <div className="field">
            <label htmlFor="shop-nickname-name">이름 *</label>
            <input id="shop-nickname-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={50} required autoComplete="name" />
          </div>
          <NicknameField value={nickname} onChange={setNickname} checkedValue={checkedNickname} onChecked={setCheckedNickname} />
          <div className="field">
            <label htmlFor="shop-nickname-phone">전화번호 (선택)</label>
            <input id="shop-nickname-phone" value={phone} onChange={(e) => { setPhone(formatPhone(e.target.value)); setPhoneMsg(""); setPhoneOk(true); }} onBlur={checkPhone} maxLength={13} inputMode="numeric" placeholder="010-1234-5678" autoComplete="tel" />
            {phoneMsg && <p className={"shop-auth-hint " + (phoneOk ? "shop-auth-ok" : "shop-auth-bad")}>{phoneMsg}</p>}
          </div>
          {errorMsg && <p className="shop-auth-error" role="alert">{errorMsg}</p>}
          <button className="btn shop-auth-submit" type="submit" disabled={loading}>
            {loading ? "저장 중…" : "시작하기"}
          </button>
        </form>
      </div>
    </div>
  );
}
