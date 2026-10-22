import React, { useState } from "react";

// 데모 로그인: 실제 사용자 인증이나 비밀번호 보호 기능이 아닙니다.
export default function Login({ onLogin }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    function submit(event) {
        event.preventDefault();
        if (email === "admin@demo.local" && password === "Demo1234!") {
            onLogin();
        } else {
            setError("데모 계정 정보를 확인해 주세요.");
        }
    }


    return (
        <main className="login-page">

            <form
                className="login-card"
                onSubmit={submit}
            >

                {/* 로그인 제목 */}
                <h1>
                    IT ERP 관리자 데모
                </h1>

                {/* 로그인 안내 */}
                <p className="muted">
                    서버 없이 화면을 확인하는 학습용 로그인입니다.
                </p>

                {/* 이메일 입력 */}
                <label>
                    이메일

                    <input
                        type="email"
                        value={email}
                        onChange={e =>
                            setEmail(e.target.value)
                        }
                        required
                    />
                </label>

                {/* 비밀번호 입력 */}
                <label>
                    비밀번호

                    <input
                        type="password"
                        value={password}
                        onChange={e =>
                            setPassword(e.target.value)
                        }
                        required
                    />
                </label>

                {/* 로그인 오류 메시지 */}
                {error && (
                    <p
                        className="error"
                        role="alert"
                    >
                        {error}
                    </p>
                )}

                {/* 로그인 버튼 */}
                <button type="submit">
                    로그인
                </button>

                {/* 데모 계정 안내 */}
                <p className="hint">
                    데모 계정: admin@demo.local / Demo1234!
                </p>

                {/* 보안 안내 */}
                <p className="hint">
                    주의: 브라우저에서만 검사하므로
                    실제 관리자 보안이 아닙니다.
                </p>

            </form>

        </main>
    );

}
