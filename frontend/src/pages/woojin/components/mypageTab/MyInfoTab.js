import ContactForm from "./ContactForm";

// 내 정보 탭 (기본 정보·비밀번호 변경)
function MyInfoTab({ user, pw, pwMsg, minPwLength, handlePwChange, handlePwSubmit }) {
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
                    <input value={`${user.division} / ${user.team}`} readOnly />
                </label>
                <label>
                    직급
                    <input value={user.rank} readOnly />
                </label>
            </div>
            <p className="mp-note">
                이름·사원번호·부서·직급은 확인만 할 수 있어요. 변경이 필요하면 관리자에게 요청해 주세요.
            </p>

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
            <p className="mp-note">
                프로토타입: 지금은 입력 검사만 해요. 실제 변경은 서버에서 현재 비밀번호를 확인하고
                새 비밀번호를 암호화해 저장하는 API를 만든 뒤 연결해요.
            </p>
        </section>
    );
}

export default MyInfoTab;
