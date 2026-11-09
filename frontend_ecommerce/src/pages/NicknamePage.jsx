import { useState } from "react";
import Breadcrumb from "../components/Breadcrumb";
import NicknameField from "../components/NicknameField";
import { callApi } from "../shopAuth";

/**
 * 닉네임 설정 화면: 구글로 처음 로그인했거나, 닉네임이 없는 옛 계정일 때 보여줘요.
 * onSaved(member): 저장 성공 시 갱신된 회원 정보를 App 에게 전달
 */
export default function NicknamePage({ member, onSaved, onNavigate }) {
  const [nickname, setNickname] = useState("");
  const [checkedNickname, setCheckedNickname] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMsg("");
    if (checkedNickname === null || checkedNickname !== nickname.trim()) return setErrorMsg("닉네임 중복확인을 먼저 해 주세요.");
    setLoading(true);
    const { data } = await callApi("/api/shop/auth/nickname", { method: "PATCH", auth: true, body: { nickname: nickname.trim() } });
    setLoading(false);
    if (data.ok) onSaved(data.member);
    else {
      setErrorMsg(data.message || "닉네임 저장에 실패했어요.");
      setCheckedNickname(null);
    }
  };

  return (
    <div className="shell">
      <Breadcrumb onHome={() => onNavigate("home")}>닉네임 설정</Breadcrumb>
      <div className="shop-auth-card">
        <h1>닉네임을 정해 주세요</h1>
        <p className="muted">{member ? member.name + "님, " : ""}처음 오셨네요! 서비스에서 보일 닉네임을 정하면 시작할 수 있어요.</p>
        <form onSubmit={handleSubmit} className="shop-auth-form">
          <NicknameField value={nickname} onChange={setNickname} checkedValue={checkedNickname} onChecked={setCheckedNickname} />
          {errorMsg && <p className="shop-auth-error" role="alert">{errorMsg}</p>}
          <button className="btn shop-auth-submit" type="submit" disabled={loading}>
            {loading ? "저장 중…" : "시작하기"}
          </button>
        </form>
      </div>
    </div>
  );
}
