import React, { useState } from "react";
import "./PraiseBox.css";

function PraiseBox() {

    // 입력칸에 작성한 내용을 저장
    const [receiver, setReceiver] = useState("");
    const [sender, setSender] = useState("");
    const [message, setMessage] = useState("");

    // 작성칸을 보여줄지 결정
    const [showForm, setShowForm] = useState(false);

    // 등록한 칭찬 목록
    const [praises, setPraises] = useState([]);

    // 입력 오류 안내
    const [error, setError] = useState("");

    // 받는 사람 입력
    function changeReceiver(event) {
        setReceiver(event.target.value);
    }

    // 보내는 사람 입력
    function changeSender(event) {
        setSender(event.target.value);
    }

    // 칭찬 내용 입력
    function changeMessage(event) {
        setMessage(event.target.value);
    }

    // 작성칸 열기
    function openForm() {
        setShowForm(true);
        setError("");
    }

    // 작성칸 닫기
    function closeForm() {
        setShowForm(false);
        setError("");
    }

    // 칭찬 등록
    function addPraise(event) {
        // 폼 제출 시 페이지가 새로고침되지 않도록 처리
        event.preventDefault();

        // 앞 뒤 공백 제거
        const receiverName = receiver.trim();
        const senderName = sender.trim();
        const praiseMessage = message.trim();

        // 빈칸 확인
        if (receiverName === "") {
            setError("칭찬받는 동료의 이름을 입력해주세요.")
            return;
        }

        if (praiseMessage === "") {
            setError("칭찬 내용을 입력해주세요.")
            return;
        }

        if (senderName === "") {
            setError("보내는 사람의 이름을 입력해주세요.")
            return;
        }

        // 오늘 날짜 만들기
        const today = new Date();

        const year = today.getFullYear();
        const month = today.getMonth() + 1;
        const day = today.getDate();

        const dateText = year + "." + month + "." + day;

        // 새로운 칭찬 한 개 만들기
        const newPraise = {
            id: Date.now(),
            receiver: receiverName,
            sender: senderName,
            message: praiseMessage,
            date: dateText
        };

        // 최신 칭찬이 앞에 나오도록 목록 맨 앞에 추가
        setPraises(function (previousPraises) {
            return [newPraise].concat(previousPraises);
        });

        // 입력칸 비우기
        setReceiver("");
        setSender("");
        setMessage("");
        setError("");

        // 작성칸 닫기
        setShowForm(false);

    }

    // 홈에서는 최근 칭찬 3개만 표시
    const recentPraises = praises.slice(0, 3);

    // 작성칸은 버튼을 눌렀을 때만 표시
    let formContent = null;

    if (showForm === true) {
        formContent = (
            <form className="praise-form" onSubmit={addPraise}>
                <div className="praise-form-names">
                    <label className="praise-field">
                        <span>칭찬받는 동료</span>

                        <input type="text"
                            placeholder="예 : 김민수"
                            value={receiver}
                            onChange={changeReceiver}
                            maxLength={20}
                            autoFocus
                        />

                    </label>

                    <label className="praise-field">
                        <span>보내는 사람</span>

                        <input type="text"
                            placeholder="내 이름"
                            value={sender}
                            onChange={changeSender}
                            maxLength={20}
                        />

                    </label>

                </div>

                <label className="praise-field">
                    <span>칭찬 내용</span>

                    <textarea placeholder="도움을 받았거나 고마웠던 일을 남겨주세요."
                        value={message}
                        onChange={changeMessage}
                        maxLength={200}
                        rows={3}
                    />
                </label>

                <p className="praise-length">
                    {message.length} / 200자
                </p>

                <p className="praise-error" role="alert">
                    {error}
                </p>

                <div className="praise-form-buttons">
                    <button type="button"
                        className="praise-cancel-button"
                        onClick={closeForm}
                    >
                        취소
                    </button>

                    <button type="submit"
                        className="praise-submit-button"
                    >
                        칭찬 등록
                    </button>
                </div>
            </form>
        )
    }

    // 칭찬이 없을 때와 있을 때의 화면 구분
    let listContent;

    if (praises.length === 0) {
        listContent = (
            <div className="praise-empty">
                <span aria-hidden="true">💌</span>
                <p>아직 등록된 칭찬이 없어요.</p>
                <p>동료에게 첫 번째 칭찬을 남겨보세요!</p>
            </div>
        );
    } else {
        listContent = (
            <ul className="praise-list">
                {recentPraises.map(function (praise) {
                    return (
                        <li className="praise-card" key={praise.id}>
                            <h3 className="praise-receiver">
                                <span aria-hidden="true">👏 </span>
                                {praise.receiver}님을 칭찬합니다
                            </h3>

                            <p className="praise-message">
                                {praise.message}
                            </p>

                            <div className="praise-card-footer">
                                <span>From. {praise.sender}</span>
                                <span>{praise.date}</span>
                            </div>

                        </li>
                    )
                })}
            </ul>
        )
    }

    return (

        <section className="praise-box" aria-label="동료 칭찬함">
            <div className="praise-header">
                <div>
                    <h2 className="praise-title">🙌 동료 칭찬함</h2>

                    <p className="praise-description">
                        동료에게 고마운 마음을 전해보세요.
                    </p>
                </div>

                <button type="button"
                    className="praise-open-button"
                    onClick={openForm}
                    disabled={showForm}
                >
                    칭찬 남기기
                </button>
            </div>

            {formContent}

            {listContent}

        </section>

    );
}


export default PraiseBox;