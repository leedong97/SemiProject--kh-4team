import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE } from "../../shared/config";
import { Link } from "react-router-dom";
import CommunityMenu from "./CommunityMenu";
import CommunityHome from "./CommunityHome";
import Board from "./Board";
import MyActivity from "./MyActivity";
import getLoginUser from "../woojin/getLoginUser";
import "./junwoo.css";

function Community() {
    const [menu, setMenu] = useState("커뮤니티 홈");
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [retryCount, setRetryCount] = useState(0);
    const [initialBoardName, setInitialBoardName] = useState("자유게시판");

    const loginUser = getLoginUser();

    let displayName = "로그인이 필요합니다";
    let displayTeam = "";

    if (!loginUser.isDummy) {
        displayName = loginUser.name;
        displayTeam = loginUser.team;
    }

    // 화면을 처음 열거나 다시 시도할 때 DB 조회
    useEffect(function () {
        // 화면을 떠난 뒤 도착한 응답은 무시
        let cancelled = false;

        async function loadPosts() {
            setIsLoading(true);
            setLoadError("");

            try {
                // 첫 페이지 조회
                const firstResponse = await axios.get(
                    API_BASE + "/api/community",
                    {
                        params: {
                            page: 1
                        }
                    }
                );

                if (cancelled) {
                    return;
                }

                const allPosts = firstResponse.data.posts.slice();
                const totalPages = firstResponse.data.totalPages;

                // 2페이지부터 마지막 페이지까지 조회
                for (let pageNumber = 2; pageNumber <= totalPages; pageNumber++) {
                    const response = await axios.get(
                        API_BASE + "/api/community",
                        {
                            params: {
                                page: pageNumber
                            }
                        }
                    );

                    if (cancelled) {
                        return;
                    }

                    const pagePosts = response.data.posts;

                    for (let i = 0; i < pagePosts.length; i++) {
                        allPosts.push(pagePosts[i]);
                    }
                }

                // 모든 페이지를 받은 뒤 화면에 반영
                if (!cancelled) {
                    setPosts(allPosts);
                }
            } catch (error) {
                console.error("커뮤니티 글 불러오기 실패:", error);

                if (!cancelled) {
                    setLoadError(
                        "게시글을 불러오지 못했습니다. 서버 실행 상태를 확인해주세요."
                    );
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        }

        loadPosts();

        return function () {
            cancelled = true;
        };
    }, [retryCount]);

    function retryLoad() {
        setRetryCount(function (previousCount) {
            return previousCount + 1;
        });
    }

    function showHome() {
        setMenu("커뮤니티 홈");
    }

    // 배너의 '게시판 둘러보기' 버튼
    function showBoard() {
        setInitialBoardName("자유게시판");
        setMenu("게시판");
    }

    // 홈에서 선택한 게시판으로 이동
    function openSelectedBoard(boardName) {
        setInitialBoardName(boardName);
        setMenu("게시판");
    }

    let content;

    if (isLoading) {
        content = (
            <div className="community-panel">
                <p className="community-empty" role="status">
                    게시글을 불러오는 중입니다.
                </p>
            </div>
        );
    } else if (loadError !== "") {
        content = (
            <div className="community-panel">
                <p role="alert">
                    {loadError}
                </p>

                <button
                    type="button"
                    className="community-button"
                    onClick={retryLoad}
                >
                    다시 시도
                </button>
            </div>
        );
    } else if (menu === "커뮤니티 홈") {
        content = (
            <CommunityHome
                posts={posts}
                onShowBoard={showBoard}
                onSelectBoard={openSelectedBoard}
            />
        );
    } else if (menu === "게시판") {
        content = (
            <Board
                posts={posts}
                setPosts={setPosts}
                initialBoardName={initialBoardName}
            />
        );
    } else if (menu === "내 활동") {
        content = (
            <MyActivity
                posts={posts}
                loginUser={loginUser}
            />
        );
    }
    return (
        <div className="community-layout community-standalone">
            <aside className="community-sidebar">
                <button
                    type="button"
                    className="lounge-brand"
                    onClick={showHome}
                    aria-label="COMMAND LOUNGE 홈"
                >
                    <span className="lounge-brand-mark">
                        C
                    </span>

                    <span className="lounge-brand-text">
                        COMMAND
                        <small>LOUNGE · 사내 커뮤니티</small>
                    </span>
                </button>

                <div className="lounge-workspace">
                    <strong>우리 회사 워크스페이스</strong>
                    <span>함께 만드는 더 좋은 일상</span>
                </div>

                <p className="lounge-menu-label">
                    WORK TOGETHER
                </p>

                <CommunityMenu
                    menu={menu}
                    changeMenu={setMenu}
                />

                <div className="lounge-sidebar-bottom">
                    <Link to="/" className="lounge-erp-link">
                        ← 직원 메인으로
                    </Link>

                    <p>동료와 연결되는 공간</p>
                </div>
            </aside>

            <div className="lounge-main">
                <header className="lounge-header">
                    <div className="lounge-breadcrumb">
                        <span>워크스페이스</span>
                        <span>/</span>
                        <strong>{menu}</strong>
                    </div>

                    <div className="lounge-user-profile">
                        <span className="lounge-user-avatar" aria-hidden="true">
                            {displayName.charAt(0)}
                        </span>

                        <div className="lounge-user-info">
                            <strong>{displayName}</strong>
                            <span>{displayTeam}</span>
                        </div>
                    </div>
                </header>

                <main className="community-content">
                    {content}
                </main>

                <footer className="lounge-footer">
                    <span>COMMAND LOUNGE</span>
                    <span>좋은 이야기가, 좋은 팀을 만듭니다.</span>
                </footer>
            </div>
        </div>
    );
}

export default Community;