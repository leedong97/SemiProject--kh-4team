import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE } from "../../../../shared/config";
import ContactForm from "./ContactForm";

function MyInfoTab({ user, pw, pwMsg, minPwLength, handlePwChange, handlePwSubmit }) {
    // 로그인할 때 저장해 둔 값은 그 뒤에 관리자가 부서·직급을 바꿔도 그대로라서,
    // 이 탭을 열 때마다 서버에서 최신 값을 받아 와요. (못 받아오면 저장해 둔 값을 그대로 보여 줘요)
    const [fresh, setFresh] = useState(null);
    useEffect(() => {
        if (user.isDummy) return;
        axios
            .get(`${API_BASE}/api/profile`, { params: { employeeId: user.id } })
            .then((res) => setFresh({ division: res.data.division, team: res.data.team, rank: res.data.grade }))
            .catch(() => {});
    }, [user.id, user.isDummy]);
    const division = (fresh && fresh.division) || user.division;
    const team = (fresh && fresh.team) || user.team;
    const rank = (fresh && fresh.rank) || user.rank;

    return (
        <section className="mp-panel">
            <h3>내 개인정보</h3>
            <div className="mp-info">
                <label>
                    이름
                    <input value={user.name} readOnly />
                </label>
                <label>
                    사원번호
                    <input value={user.empNo} readOnly />
                </label>
                <label>
                    부서
                    <input value={`${division} / ${team}`} readOnly />
                </label>
                <label>
                    직급
                    <input value={rank} readOnly />
                </label>
            </div>

            <ContactForm user={user} />

            <h3>비밀번호 변경</h3>
            <form className="mp-info" onSubmit={handlePwSubmit}>
                <label>
                    현재 비밀번호
                    <input
                        type="password"
                        name="current"
                        value={pw.current}
                        onChange={handlePwChange}
                        autoComplete="current-password"
                    />
                </label>
                <label>
                    새 비밀번호 ({minPwLength}자 이상)
                    <input
                        type="password"
                        name="next"
                        value={pw.next}
                        onChange={handlePwChange}
                        autoComplete="new-password"
                    />
                </label>
                <label>
                    새 비밀번호 확인
                    <input
                        type="password"
                        name="confirm"
                        value={pw.confirm}
                        onChange={handlePwChange}
                        autoComplete="new-password"
                    />
                </label>

                {pwMsg && (
                    <p className={pwMsg.type === "ok" ? "mp-ok" : "mp-error"}>{pwMsg.text}</p>
                )}

                <button type="submit" className="mp-submit">비밀번호 변경</button>
            </form>
        </section>
    );
}

export default MyInfoTab;
