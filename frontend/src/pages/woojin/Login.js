import axios from "axios";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";
import { saveLoginUser } from "./getLoginUser";

// 로그인 화면
function Login() {

    const navi = useNavigate()

    const [values, setValues] = useState({
        email: '',
        password: ''
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
        axios.post('http://localhost:3333/api/login', values)
            .then((res) => {
                saveLoginUser(res.data.user);
                if (res.data.user.employee_role === "관리자") {
                    navi("/admin");
                } else {
                    navi("/");
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
