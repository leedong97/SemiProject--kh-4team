import React, { useEffect, useRef, useState } from "react";
import axios from "../dong/communityClient";
import { API_BASE } from "../../shared/config";
import "./PraiseBox.css";

function PraiseBox() {
    const [receiverId, setReceiverId] = useState("");
    const [message, setMessage] = useState("");

    const [showForm, setShowForm] = useState(false);

    const [praises, setPraises] = useState([]);
    const [recipients, setRecipients] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [retryCount, setRetryCount] = useState(0);

    const [loadError, setLoadError] = useState("");
    const [error, setError] = useState("");

    const savingRef = useRef(false);

    // 최초 표시 및 다시 시도할 때 DB 조회
    useEffect(function () {
        let cancelled = false;

        async function loadPraiseBox() {
            setIsLoading(true);
            setLoadError("");

            try {
                const [
                    praiseResponse,
                    recipientResponse,
                ] = await Promise.all([
                    axios.get(
                        API_BASE + "/api/community-praises"
                    ),
                    axios.get(
                        API_BASE + "/api/community-praises/recipients"
                    ),
                ]);

                if (cancelled) {
                    return;
                }

                setPraises(praiseResponse.data);
                setRecipients(
                    recipientResponse.data.recipients
                );
                setCurrentUser(
                    recipientResponse.data.currentUser
                );
            } catch (requestError) {
                if (!cancelled) {
                    setLoadError(
                        requestError.response?.data?.message ||
                        "칭찬함을 불러오지 못했습니다."
                    );
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        }

        loadPraiseBox();

        return function () {
            cancelled = true;
        };
    }, [retryCount]);

    function openForm() {
        setReceiverId("");
        setMessage("");
        setError("");
        setShowForm(true);
    }

    function closeForm() {
        if (savingRef.current) {
            return;
        }

        setShowForm(false);
        setReceiverId("");
        setMessage("");
        setError("");
    }

    async function addPraise(event) {
        event.preventDefault();

        if (savingRef.current) {
            return;
        }

        const selectedReceiverId = Number(receiverId);
        const trimmedMessage = message.trim();

        if (
            !Number.isSafeInteger(selectedReceiverId) ||
            selectedReceiverId < 1
        ) {
            setError("칭찬받는 동료를 선택해주세요.");
            return;
        }

        if (
            trimmedMessage.length < 1 ||
            trimmedMessage.length > 200
        ) {
            setError("칭찬 내용은 1~200자로 입력해주세요.");
            return;
        }

        savingRef.current = true;
        setIsSaving(true);
        setError("");

        try {
            const response = await axios.post(
                API_BASE + "/api/community-praises",
                {
                    receiverId: selectedReceiverId,
                    message: trimmedMessage,
                }
            );

            const savedPraise = response.data.praise;

            // DB 저장 성공 후 화면에 반영
            setPraises(function (previousPraises) {
                return [
                    savedPraise,
                    ...previousPraises.filter(function (praise) {
                        return String(praise.id) !==
                            String(savedPraise.id);
                    }),
                ].slice(0, 3);
            });

            setReceiverId("");
            setMessage("");
            setShowForm(false);
        } catch (requestError) {
            setError(
                requestError.response?.data?.message ||
                "칭찬 등록에 실패했습니다."
            );
        } finally {
            savingRef.current = false;
            setIsSaving(false);
        }
    }

    return (
        <section
            className="praise-box"
            aria-label="동료 칭찬함"
        >
            <div className="praise-header">
                <div>
                    <h2 className="praise-title">
                        🙌 동료 칭찬함
                    </h2>

                    <p className="praise-description">
                        동료에게 고마운 마음을 전해보세요.
                    </p>
                </div>

                <button
                    type="button"
                    className="praise-open-button"
                    onClick={openForm}
                    disabled={
                        showForm ||
                        isLoading ||
                        Boolean(loadError) ||
                        !currentUser
                    }
                >
                    칭찬 남기기
                </button>
            </div>

            {isLoading ? (
                <p role="status">
                    칭찬함을 불러오는 중입니다.
                </p>
            ) : loadError ? (
                <div className="praise-empty">
                    <p className="praise-error" role="alert">
                        {loadError}
                    </p>

                    <button
                        type="button"
                        onClick={function () {
                            setRetryCount(function (previous) {
                                return previous + 1;
                            });
                        }}
                    >
                        다시 시도
                    </button>
                </div>
            ) : (
                <>
                    {showForm && (
                        <form
                            className="praise-form"
                            onSubmit={addPraise}
                        >
                            <div className="praise-form-names">
                                <label className="praise-field">
                                    <span>칭찬받는 동료</span>

                                    <select
                                        value={receiverId}
                                        onChange={function (event) {
                                            setReceiverId(
                                                event.target.value
                                            );
                                        }}
                                        disabled={isSaving}
                                        required
                                    >
                                        <option value="">
                                            동료를 선택해주세요
                                        </option>

                                        {recipients.map(function (employee) {
                                            return (
                                                <option
                                                    key={employee.id}
                                                    value={employee.id}
                                                >
                                                    {employee.name}
                                                    {" · "}
                                                    {employee.team || "부서 미등록"}
                                                    {" · "}
                                                    {employee.employeeCode ||
                                                        employee.id}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </label>

                                <label className="praise-field">
                                    <span>보내는 사람</span>

                                    <input
                                        type="text"
                                        value={currentUser?.name || ""}
                                        readOnly
                                    />
                                </label>
                            </div>

                            {recipients.length === 0 && (
                                <p className="praise-error">
                                    선택할 다른 재직 직원이 없습니다.
                                </p>
                            )}

                            <label className="praise-field">
                                <span>칭찬 내용</span>

                                <textarea
                                    placeholder="도움을 받았거나 고마웠던 일을 남겨주세요."
                                    value={message}
                                    onChange={function (event) {
                                        setMessage(
                                            event.target.value
                                        );
                                    }}
                                    maxLength={200}
                                    rows={3}
                                    disabled={isSaving}
                                    required
                                />
                            </label>

                            <p className="praise-length">
                                {message.length} / 200자
                            </p>

                            {error && (
                                <p
                                    className="praise-error"
                                    role="alert"
                                >
                                    {error}
                                </p>
                            )}

                            <div className="praise-form-buttons">
                                <button
                                    type="button"
                                    className="praise-cancel-button"
                                    onClick={closeForm}
                                    disabled={isSaving}
                                >
                                    취소
                                </button>

                                <button
                                    type="submit"
                                    className="praise-submit-button"
                                    disabled={
                                        isSaving ||
                                        recipients.length === 0
                                    }
                                >
                                    {isSaving
                                        ? "저장 중…"
                                        : "칭찬 등록"}
                                </button>
                            </div>
                        </form>
                    )}

                    {praises.length === 0 ? (
                        <div className="praise-empty">
                            <span aria-hidden="true">💌</span>
                            <p>아직 등록된 칭찬이 없어요.</p>
                            <p>
                                동료에게 첫 번째 칭찬을 남겨보세요!
                            </p>
                        </div>
                    ) : (
                        <ul className="praise-list">
                            {praises.map(function (praise) {
                                return (
                                    <li
                                        className="praise-card"
                                        key={praise.id}
                                    >
                                        <h3 className="praise-receiver">
                                            <span aria-hidden="true">
                                                👏{" "}
                                            </span>
                                            {praise.receiver}님을 칭찬합니다
                                        </h3>

                                        <p className="praise-message">
                                            {praise.message}
                                        </p>

                                        <div className="praise-card-footer">
                                            <span>
                                                From. {praise.sender}
                                            </span>

                                            <span>{praise.date}</span>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </>
            )}
        </section>
    );
}

export default PraiseBox;