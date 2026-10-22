import axios from "axios";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Signup() {

    const navi = useNavigate()

    const [values, setValues] = useState({
        name: '',
        email: '',
        password: '',
        passwordConfirm: ''
    })
    const [errors, setErrors] = useState({});

    const handleInput = (e) => {
        setValues({ ...values, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (values.name.trim() === "") {
            setErrors({ name: "이름을 입력하세요" });
            return;
        }
        if (values.email.trim() === "") {
            setErrors({ email: "이메일을 입력하세요" });
            return;
        }
        if (!values.email.includes("@")) {
            setErrors({ email: "이메일 형식이 올바르지 않아요" });
            return;
        }
        if (values.password.length < 8) {
            setErrors({ password: "비밀번호는 8자 이상 입력하세요" });
            return;
        }
        if (values.password !== values.passwordConfirm) {
            setErrors({ passwordConfirm: "비밀번호가 서로 달라요" });
            return;
        }

        setErrors({})

        axios.post('http://localhost:3333/signup', {
            name: values.name.trim(),
            email: values.email.trim(),
            password: values.password
        })
            .then(() => {
                alert("회원가입이 완료되었어요");
                navi("/");
            })
            .catch((err) => {
                if (err.response && err.response.status === 409) {
                    setErrors({ email: "이미 가입된 이메일이에요" });
                } else {
                    setErrors({ signup: "서버에 연결할 수 없어요. 잠시 후 다시 시도해 주세요" });
                }
            });
    }

    return (
        <div className="signup">
            <h2>회원가입</h2>
            <form onSubmit={handleSubmit} noValidate>
                <div className='signup-form'>
                    <input type='text'
                        name='name'
                        value={values.name}
                        onChange={handleInput}
                        placeholder='이름을 입력하세요' />
                    {errors.name && <p className='error'>{errors.name}</p>}

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
                        placeholder='password 를 입력하세요 (8자 이상)' />
                    {errors.password && <p className='error'>{errors.password}</p>}

                    <input type='password'
                        name='passwordConfirm'
                        value={values.passwordConfirm}
                        onChange={handleInput}
                        placeholder='password 를 다시 입력하세요' />
                    {errors.passwordConfirm && <p className='error'>{errors.passwordConfirm}</p>}

                    {errors.signup && <p className='error'>{errors.signup}</p>}

                    <button className="btn-signup" type='submit'>
                        가입하기
                    </button>

                    <p>이미 계정이 있으신가요?</p>
                    <Link to="/">로그인</Link>
                </div>
            </form>
        </div>
    )
}
export default Signup