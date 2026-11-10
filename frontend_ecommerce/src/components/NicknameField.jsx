import { useState } from "react";
import { callApi, NICKNAME_PATTERN, NICKNAME_RULE } from "../shopAuth";

/**
 * 닉네임 입력칸 + 중복확인 버튼
 * value        : 부모가 들고 있는 닉네임
 * onChange     : 글자를 고칠 때 부모에게 알림
 * checkedValue : 중복확인을 통과한 닉네임 (부모가 가입 버튼 활성화에 사용)
 * onChecked    : 통과한 닉네임을 부모에게 알림 (고치면 null)
 * 주의: 이 확인은 편의용이에요. 마지막 보증은 서버(DB UNIQUE)가 한 번 더 해요.
 */
export default function NicknameField({ value, onChange, checkedValue, onChecked }) {
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleChange = (event) => {
    onChange(event.target.value);
    onChecked(null); // 글자를 고치면 이전 확인은 무효
    setMsg("");
    setOk(false);
  };

  const check = async () => {
    const nickname = value.trim();
    if (!NICKNAME_PATTERN.test(nickname)) {
      setOk(false);
      setMsg("닉네임은 " + NICKNAME_RULE);
      return;
    }
    setBusy(true);
    const { data } = await callApi("/api/shop/auth/nickname-check?nickname=" + encodeURIComponent(nickname));
    setBusy(false);
    const available = data.ok === true && data.available === true;
    setOk(available);
    setMsg(data.message || (available ? "사용할 수 있어요." : "확인에 실패했어요."));
    onChecked(available ? nickname : null);
  };

  const passed = checkedValue !== null && checkedValue === value.trim();

  return (
    <div className="field shop-auth-nick">
      <label htmlFor="shop-auth-nickname">닉네임 *</label>
      <div className="shop-auth-nick-row">
        <input
          id="shop-auth-nickname"
          value={value}
          onChange={handleChange}
          maxLength={12}
          placeholder="예: 커맨드러버"
          autoComplete="nickname"
        />
        <button type="button" className="btn ghost shop-auth-check" onClick={check} disabled={busy || !value.trim()}>
          {busy ? "확인 중…" : passed ? "확인 완료 ✓" : "중복확인"}
        </button>
      </div>
      <p className={"shop-auth-hint" + (msg ? (ok ? " shop-auth-ok" : " shop-auth-bad") : "")}>
        {msg || NICKNAME_RULE}
      </p>
    </div>
  );
}
