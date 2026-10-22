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

    return <main className="login-page"><form className="login-card" onSubmit={submit}>
        <h1>IT ERP 관리자 데모</h1>
        <p className="muted">서버 없이 화면을 확인하는 학습용 로그인입니다.</p>
        <label>이메일<input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></label>
        <label>비밀번호<input type="password" value={password} onChange={e => setPassword(e.target.value)} required /></label>
        {error && <p className="error" role="alert">{error}</p>}
        <button type="submit">로그인</button>
        <p className="hint">데모 계정: admin@demo.local / Demo1234!</p>
        <p className="hint">주의: 브라우저에서만 검사하므로 실제 관리자 보안이 아닙니다.</p>
    </form></main>;
}
