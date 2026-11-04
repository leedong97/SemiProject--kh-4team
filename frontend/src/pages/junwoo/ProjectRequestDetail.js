import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { API_BASE } from "../../shared/config";

function ProjectRequestDetail() {
    const params = useParams();
    const requestId = params.id;

    const [request, setRequest] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const [reloadCount, setReloadCount] = useState(0);

    useEffect(function () {
        let cancelled = false;

        async function loadRequest() {
            setIsLoading(true);
            setErrorMessage("");
            setRequest(null);

            try {
                const response = await axios.get(
                    API_BASE + "/api/project-requests/" + requestId
                );

                if (!cancelled) {
                    setRequest(response.data);
                }
            } catch (error) {
                let message = "요청 상세를 불러오지 못했습니다.";

                if (
                    error.response &&
                    error.response.data &&
                    error.response.data.message
                ) {
                    message = error.response.data.message;
                }

                if (!cancelled) {
                    setErrorMessage(message);
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        }

        loadRequest();

        return function () {
            cancelled = true;
        };
    }, [requestId, reloadCount]);

    if (isLoading) {
        return (
            <main className="request-detail-page">
                <p role="status">요청 정보를 불러오는 중입니다.</p>
            </main>
        );
    }

    if (errorMessage !== "" || request === null) {
        return (
            <main className="request-detail-page">
                <p role="alert">
                    {errorMessage || "등록 요청을 찾을 수 없습니다."}
                </p>

                <div className="request-detail-actions">
                    <button
                        type="button"
                        className="request-detail-button"
                        onClick={function () {
                            setReloadCount(function (count) {
                                return count + 1;
                            });
                        }}
                    >
                        다시 시도
                    </button>

                    <Link
                        to="/todo"
                        className="request-detail-button"
                    >
                        프로젝트 목록
                    </Link>
                </div>
            </main>
        );
    }

    let statusClass = "request-detail-status";
    let listTab = "프로젝트 목록";

    if (request.requestStatus === "대기") {
        statusClass += " waiting";
        listTab = "대기";
    } else if (request.requestStatus === "승인") {
        statusClass += " approved";
        listTab = "승인";
    } else if (request.requestStatus === "반려") {
        statusClass += " rejected";
    }

    return (
        <main className="request-detail-page">
            <header className="request-detail-header">
                <div>
                    <p className="request-detail-caption">
                        프로젝트 등록 요청
                    </p>

                    <h1>{request.title}</h1>
                </div>

                <span className={statusClass}>
                    {request.requestStatus}
                </span>
            </header>

            <section className="request-detail-info">
                <div>
                    <span>작성자</span>
                    <strong>{request.author}</strong>
                </div>

                <div>
                    <span>요청일시</span>
                    <strong>{request.createdAt || "-"}</strong>
                </div>

                <div>
                    <span>시작일</span>
                    <strong>{request.startDate || "-"}</strong>
                </div>

                <div>
                    <span>종료일</span>
                    <strong>{request.endDate || "-"}</strong>
                </div>

                <div>
                    <span>프로젝트 상태</span>
                    <strong>{request.projectStatus}</strong>
                </div>

                <div>
                    <span>우선순위</span>
                    <strong>{request.priority}</strong>
                </div>
            </section>

            <section className="request-detail-content">
                <h2>요청 내용</h2>
                <p>{request.content}</p>
            </section>

            {request.requestStatus === "대기" && (
                <p className="request-detail-notice">
                    관리자 승인을 기다리고 있는 요청입니다.
                </p>
            )}

            {request.requestStatus !== "대기" && (
                <section className="request-detail-process">
                    <h2>처리 정보</h2>

                    <p>
                        처리자: {request.processedBy || "기록 없음"}
                    </p>

                    <p>
                        처리일시: {request.processedAt || "기록 없음"}
                    </p>
                </section>
            )}

            <div className="request-detail-actions">
                <Link
                    to="/todo"
                    state={{ requestTab: listTab }}
                    className="request-detail-button"
                >
                    목록으로
                </Link>

                {request.requestStatus === "승인" &&
                    request.approvedProjectId != null && (
                        <Link
                            to={"/todo/" + request.approvedProjectId}
                            className="request-detail-button primary"
                        >
                            등록된 프로젝트 보기
                        </Link>
                    )}
            </div>
        </main>
    );
}

export default ProjectRequestDetail;