
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { API_BASE } from "../../shared/config";

function Todo({ todo, onAddTodo }) {

    const navigate = useNavigate();

    const location = useLocation();

    // 캘린더에서 선택한 날짜
    const selectedDate = location.state?.startDate || "";

    // 검색 및 페이지
    const [search, setSearch] = useState("");
    const [pages, setPages] = useState(1);

    // 선택한 탭
    let initialTab = "프로젝트 목록";

    if (location.state) {
        if (location.state.requestTab === "대기") {
            initialTab = "대기";
        } else if (location.state.requestTab === "승인") {
            initialTab = "승인";
        }
    }

    const [listTab, setListTab] = useState(initialTab);

    // 서버에서 가져온 등록 요청 목록
    const [requests, setRequests] = useState([]);

    // 요청 목록 조회 상태
    const [requestLoading, setRequestLoading] = useState(
        initialTab !== "프로젝트 목록"
    );
    const [requestError, setRequestError] = useState("");

    // 등록 후 목록을 다시 불러올 때 사용
    const [requestReload, setRequestReload] = useState(0);

    // ===================================
    // 목록 탭 변경
    // ===================================

    function changeListTab(nextTab) {
        if (listTab === nextTab) {
            return;
        }

        setListTab(nextTab);
        setPages(1);
        setRequests([]);
        setRequestError("");

        if (nextTab === "프로젝트 목록") {
            setRequestLoading(false);
        } else {
            setRequestLoading(true);
        }
    }

    // ===================================
    // 대기 · 승인 요청 목록 불러오기
    // ===================================

    useEffect(function () {
        if (listTab === "프로젝트 목록") {
            return;
        }

        let cancelled = false;

        async function loadRequests() {
            setRequestLoading(true);
            setRequestError("");

            try {
                const response = await axios.get(
                    API_BASE + "/api/project-requests",
                    {
                        params: {
                            requestStatus: listTab
                        }
                    }
                );

                if (!cancelled) {
                    setRequests(response.data);
                }
            } catch (error) {
                if (!cancelled) {
                    setRequestError(
                        "요청 목록을 불러오지 못했습니다."
                    );
                }
            } finally {
                if (!cancelled) {
                    setRequestLoading(false);
                }
            }
        }

        loadRequests();

        return function () {
            cancelled = true;
        };
    }, [listTab, requestReload]);

    // 새로운 프로젝트
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");

    const [isSaving, setIsSaving] = useState(false);

    // 프로젝트 상태와 우선순위
    const [status, setStatus] = useState("예정");
    const [priority, setPriority] = useState("보통");

    // 프로젝트 시작일과 종료일
    const [startDate, setStartDate] = useState(selectedDate);
    const [endDate, setEndDate] = useState(selectedDate);

    // 현재 탭에서 사용할 목록
    let sourceList = todo;

    if (listTab !== "프로젝트 목록") {
        sourceList = requests;
    }

    // 제목 검색
    const filteredTodo = sourceList.filter(function (item) {
        return item.title
            .toLowerCase()
            .includes(search.trim().toLowerCase());
    });

    // 일반 프로젝트만 기존 방식으로 정렬
    // 요청 목록은 서버에서 최신순으로 받아옴
    if (listTab === "프로젝트 목록") {
        filteredTodo.sort(function (a, b) {
            return (
                Number(b.sortAt ?? 0) - Number(a.sortAt ?? 0)
            ) || (
                    b.id - a.id
                );
        });
    }

    // 페이지네이션 (10개씩)
    const totalPages = Math.ceil(filteredTodo.length / 10);
    const currentPage = Math.min(pages, Math.max(totalPages, 1));
    const start = (currentPage - 1) * 10;
    const end = start + 10;


    /* 프로젝트 등록 */
    const handleAddTodo = async () => {

        // 이미 등록 중이면 추가 요청하지 않음
        if (isSaving) return;

        if (title.trim() === "") {
            alert("프로젝트 제목을 입력해주세요.");
            return;
        }

        if (content.trim() === "") {
            alert("프로젝트 내용을 입력해주세요.");
            return;
        }

        if (title.trim().length > 200) {
            alert("제목은 최대 200자까지 입력할 수 있습니다.");
            return;
        }

        if (!startDate || !endDate) {
            alert("프로젝트 시작일과 종료일을 선택해주세요.");
            return;
        }

        if (endDate < startDate) {
            alert("종료일은 시작일보다 빠를 수 없습니다.");
            return;
        }

        // 입력값 검사가 끝났으므로 등록 시작
        setIsSaving(true);

        try {
            await onAddTodo(
                title.trim(),
                content.trim(),
                startDate,
                endDate,
                status,
                priority
            );

            setTitle("");
            setContent("");
            setStartDate("");
            setEndDate("");
            setStatus("예정");
            setPriority("보통");

            alert(
                "프로젝트 등록 요청이 접수되었습니다.\n" +
                "관리자 승인 후 프로젝트가 등록됩니다."
            );

            setRequests([]);
            setRequestError("");
            setRequestLoading(true);

            setListTab("대기");
            setPages(1);
            setSearch("");

            setRequestReload(function (count) {
                return count + 1;
            });

        } catch (error) {
            console.error("프로젝트 등록 오류:", error);
            alert(error.message || "프로젝트 등록 실패");

        } finally {
            // 성공하든 실패하든 등록 중 상태 해제
            setIsSaving(false);
        }
    };


    // 검색 리셋
    const handleReset = () => {
        setSearch("");
        setPages(1);
    };

    return (
        <main className="todo-page todo-manage-page">

            {/* 상단 제목 */}
            <div className="todo-header todo-manage-header">
                <div>
                    <h1>프로젝트</h1>
                    <p>
                        사내 프로젝트를 조회할 수 있습니다.
                    </p>
                </div>

                <button
                    className="todo-reset"
                    onClick={handleReset}
                >
                    검색 리셋
                </button>
            </div>

            {/* 프로젝트 통계 */}
            <div className="todo-summary">
                <span>전체 프로젝트 {todo.length}개</span>
                <span>현재 목록 검색 결과 {filteredTodo.length}개</span>
            </div>

            {/* 프로젝트 검색 */}
            <section className="todo-filter">

                <label htmlFor="todo-search">
                    프로젝트 제목 검색
                </label>

                <input
                    id="todo-search"
                    type="text"
                    placeholder="프로젝트 제목 검색"
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPages(1);
                    }}
                />

            </section>

            {/* 프로젝트 등록 */}
            <section className="todo-register">

                <h3>새로운 프로젝트 등록</h3>

                <div className="todo-register-form">

                    <input
                        type="text"
                        placeholder="프로젝트 제목을 입력하세요"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />

                    <textarea
                        placeholder="프로젝트 내용을 입력하세요"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows="5"
                    />

                    {/* 프로젝트 상태 */}
                    <div className="todo-select-field">
                        <label htmlFor="todo-status">프로젝트 상태</label>

                        <select
                            id="todo-status"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                        >
                            <option value="예정">예정</option>
                            <option value="진행중">진행중</option>
                            <option value="완료">완료</option>
                            <option value="보류">보류</option>
                        </select>
                    </div>

                    {/* 프로젝트 우선순위 */}
                    <div className="todo-select-field">
                        <label htmlFor="todo-priority">우선순위</label>

                        <select
                            id="todo-priority"
                            value={priority}
                            onChange={(e) => setPriority(e.target.value)}
                        >
                            <option value="낮음">낮음</option>
                            <option value="보통">보통</option>
                            <option value="높음">높음</option>
                        </select>
                    </div>

                    {/* 프로젝트 일정 설정 */}
                    <div className="todo-date-fields">

                        <div>
                            <label htmlFor="todo-start-date">
                                프로젝트 시작일
                            </label>

                            <input
                                id="todo-start-date"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>

                        <div>
                            <label htmlFor="todo-end-date">
                                프로젝트 종료일
                            </label>

                            <input
                                id="todo-end-date"
                                type="date"
                                value={endDate}
                                min={startDate || undefined}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>

                    </div>


                    <button
                        type="button"
                        onClick={handleAddTodo}
                        disabled={isSaving}
                    >
                        {isSaving ? "등록 중…" : "+ 프로젝트 등록 요청"}
                    </button>

                </div>
            </section>

            {/* 프로젝트 목록 */}
            <section className="todo-list-section">

                <div className="todo-list-header">
                    <div className="todo-status-tabs">
                        <button
                            type="button"
                            className={
                                listTab === "프로젝트 목록"
                                    ? "todo-status-tab active"
                                    : "todo-status-tab"
                            }
                            onClick={function () {
                                changeListTab("프로젝트 목록");
                            }}
                        >
                            프로젝트 목록
                        </button>

                        <button
                            type="button"
                            className={
                                listTab === "대기"
                                    ? "todo-status-tab active"
                                    : "todo-status-tab"
                            }
                            onClick={function () {
                                changeListTab("대기");
                            }}
                        >
                            대기 중
                        </button>

                        <button
                            type="button"
                            className={
                                listTab === "승인"
                                    ? "todo-status-tab active"
                                    : "todo-status-tab"
                            }
                            onClick={function () {
                                changeListTab("승인");
                            }}
                        >
                            승인됨
                        </button>
                    </div>

                    {!requestLoading && requestError === "" && (
                        <span>{filteredTodo.length}건</span>
                    )}
                </div>

                <table className="todo-table">
                    <thead>
                        <tr>
                            <th scope="col">번호</th>
                            <th scope="col">프로젝트 제목</th>
                            <th scope="col">작성자</th>
                            <th scope="col">
                                {listTab === "프로젝트 목록"
                                    ? "작성일자"
                                    : "요청일자"}
                            </th>
                            <th scope="col">
                                {listTab === "프로젝트 목록"
                                    ? "조회수"
                                    : "상태"}
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        {requestLoading ? (
                            <tr>
                                <td colSpan="5" className="todo-empty">
                                    목록을 불러오는 중입니다.
                                </td>
                            </tr>
                        ) : requestError !== "" ? (
                            <tr>
                                <td colSpan="5" className="todo-empty">
                                    <p role="alert">{requestError}</p>

                                    <button
                                        type="button"
                                        onClick={function () {
                                            setRequestReload(function (count) {
                                                return count + 1;
                                            });
                                        }}
                                    >
                                        다시 시도
                                    </button>
                                </td>
                            </tr>
                        ) : filteredTodo.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="todo-empty">
                                    {search.trim() !== ""
                                        ? "검색 결과가 없습니다."
                                        : "해당 목록에 등록된 항목이 없습니다."}
                                </td>
                            </tr>
                        ) : (
                            filteredTodo.slice(start, end).map(function (item, index) {
                                let rowKey;
                                let detailAddress;

                                if (listTab === "프로젝트 목록") {
                                    rowKey = "project-" + item.id;
                                    detailAddress = "/todo/" + item.id;
                                } else {
                                    rowKey = "request-" + item.requestId;
                                    detailAddress = "/project-requests/" + item.requestId;
                                }

                                const titleContent = (
                                    <Link
                                        to={detailAddress}
                                        className="todo-title-link"
                                    >
                                        {item.title}
                                    </Link>
                                );

                                let statusClass = "todo-request-status";

                                if (item.requestStatus === "대기") {
                                    statusClass += " waiting";
                                } else if (item.requestStatus === "승인") {
                                    statusClass += " approved";
                                }

                                return (
                                    <tr key={rowKey}>
                                        <td>{start + index + 1}</td>

                                        <td>{titleContent}</td>

                                        <td>{item.author}</td>

                                        <td>{item.date}</td>

                                        <td>
                                            {listTab === "프로젝트 목록" ? (
                                                item.views ?? 0
                                            ) : (
                                                <span className={statusClass}>
                                                    {item.requestStatus}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>

                {/* 페이지 번호 */}
                {!requestLoading && requestError === "" && totalPages > 1 && (
                    <div className="todo-pages">

                        {Array.from(
                            { length: totalPages },
                            (_, i) => i + 1
                        ).map((num) => (
                            <button
                                key={num}
                                className={currentPage === num ? "active" : ""}
                                onClick={() => setPages(num)}
                            >
                                {num}
                            </button>
                        ))}

                    </div>
                )}

            </section>

            {/* 하단 설명 */}
            <p className="todo-footer">
                프로젝트 제목을 클릭하면 상세 내용을 확인할 수 있습니다.
            </p>

        </main>
    );
}

export default Todo;
