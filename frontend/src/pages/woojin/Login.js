import { API_BASE } from '../../shared/config';
import axios from "axios";
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";
import getLoginUser, { saveLoginUser } from "./getLoginUser";

function Login() {

    const navi = useNavigate()
    //로그인이 끝나면 다른 화면으로 이동할 때 사용한다.

    // 이미 로그인한 사람이 /login 으로 들어오면(뒤로가기 등) 로그인 화면을 보여 주지 않고 바로 내 화면으로 보낸다.
    // replace: true -> 지금 주소(/login)를 기록에서 "바꿔치기"해서, 뒤로가기를 눌러도 /login 으로 돌아오지 않는다.
    useEffect(() => {
        const user = getLoginUser();
        if (!user.isDummy) {
            navi(user.role === "관리자" ? "/admin" : "/", { replace: true });
        }
    }, [navi]);

    const [values, setValues] = useState({
        email: '',
        password: ''
        //입력한 이메일과 비밀번호를 저장한다, 처음에는 빈 문자열이다
    })
    const [errors, setErrors] = useState({});

    const handleInput = (e) => {
        setValues({ ...values, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (values.email.trim() === "") {
            setErrors({ email: "이메일을 입력하세요" })
            return;
        }
        if (values.password.trim() === "") {
            setErrors({ password: "비밀번호를 입력하세요" })
            return;
        }

        setErrors({})
        axios.post(`${API_BASE}/api/auth/login`, values)
            .then((res) => {
                localStorage.setItem('communityToken', res.data.communityToken);
                if (res.data.authToken) localStorage.setItem('nexus_auth_token', res.data.authToken); // 직원평가 등에서 사용
                saveLoginUser(res.data.user); // 서버가 준 직원 정보를 저장 (마이페이지에서 꺼내 써요)
                // 로그인 성공 → 권한에 따라 이동할 화면을 나눈다
                if (res.data.user.employee_role === "관리자") {
                    navi("/admin", { replace: true }); // 관리자 → 관리자 화면 (replace: 뒤로가기로 /login 에 안 돌아오게)
                } else {
                    navi("/", { replace: true }); // 일반 사용자 → 대시보드(메인)
                }
            })
            .catch((err) => {
                if (err.response && err.response.status === 401) {
                    setErrors({ login: "이메일 또는 비밀번호를 확인하세요" });
                } else {
                    setErrors({ login: "서버에 연결할 수 없어요. 잠시 후 다시 시도해 주세요" });
                }
            });
    }

    return (
        <div className="login">
            <h2>로그인</h2>
            <form onSubmit={handleSubmit} noValidate>
                <div className='email'>
                    <input type='email'
                        name='email'
                        value={values.email}
                        onChange={handleInput}
                        placeholder='email 을 입력하세요' />
                    {errors.email && <p className='error'>{errors.email}</p>}


                    <input type='password'
                        name='password'
                        value={values.password}
                        onChange={handleInput}
                        placeholder='password 를 입력하세요' />
                    {errors.password && <p className='error'>{errors.password}</p>}
                    {errors.login && <p className='error'>{errors.login}</p>}
                    <button className="btn-login"
                        type='submit'>
                        Login
                    </button>

                    <p>가입된 계정이 없으신가요?</p>
                    <Link to="/signup">
                        Sign up
                    </Link>

                </div>


            </form>

        </div>
    )

};
export default Login