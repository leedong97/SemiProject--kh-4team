import React, { useState } from "react";
import { Link } from "react-router-dom";
import ReactionGame from "./ReactionGame";
import LunchPicker from "./LunchPicker";
import PraiseBox from "./PraiseBox";
import CommunityBanner from "./CommunityBanner";

const boards = [
    { name: "자유게시판", key: "free" },
    { name: "질문 답변", key: "question" },
    { name: "정보공유", key: "info" }
];

function CommunityHome(props) {
    const [searchText, setSearchText] = useState("");
    const keyword = searchText.trim().toLowerCase();
    const recentPosts = props.posts.slice().sort(function (a, b) {
        return (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0);
    });
    const matchingPosts = recentPosts.filter(function (post) {
        return (post.title || "").toLowerCase().includes(keyword)
            || (post.content || "").toLowerCase().includes(keyword);
    });

    function openFreeBoard() { props.onSelectBoard("자유게시판"); }
    function openQuestionBoard() { props.onSelectBoard("질문 답변"); }
    function openInfoBoard() { props.onSelectBoard("정보공유"); }

    const freeCount = props.posts.filter(post => post.boardName === "자유게시판").length;
    const questionCount = props.posts.filter(post => post.boardName === "질문 답변").length;
    const infoCount = props.posts.filter(post => post.boardName === "정보공유").length;

    function formatDate(value) {
        const date = new Date(value);
        if (!value || Number.isNaN(date.getTime())) return "-";
        return date.getFullYear() + "." + (date.getMonth() + 1) + "." + date.getDate();
    }

    return (
        <>
            <CommunityBanner />
            <div className="lounge-home-grid">
                <div className="lounge-home-boards">
                    <div className="lounge-search-toolbar lounge-home-search">
                        <input
                            type="search"
                            className="lounge-search-input"
                            aria-label="전체 게시판 제목 또는 내용 검색"
                            placeholder="전체 게시판의 제목이나 내용을 검색하세요"
                            value={searchText}
                            onChange={event => setSearchText(event.target.value)}
                        />
                        <button type="button" className="lounge-search-reset" onClick={() => setSearchText("")}>
                            초기화
                        </button>
                    </div>
                    <div className="lounge-board-grid">
                        {boards.map(function (board) {
                            const posts = matchingPosts.filter(post => post.boardName === board.name);
                            return (
                                <section
                                    key={board.key}
                                    className={"community-panel lounge-feed-panel lounge-board-card lounge-board-card-" + board.key}
                                    aria-labelledby={"home-board-" + board.key}
                                >
                                    <div className="community-board-header">
                                        <h2 className="community-panel-title" id={"home-board-" + board.key}>
                                            <span className={"lounge-category-dot lounge-dot-" + board.key} aria-hidden="true" />
                                            {board.name}
                                        </h2>
                                        <button
                                            type="button"
                                            className="lounge-board-more"
                                            aria-label={board.name + " 더보기"}
                                            onClick={() => props.onSelectBoard(board.name)}
                                        >
                                            더보기 →
                                        </button>
                                    </div>
                                    <p className="lounge-board-summary" role="status">
                                        {keyword ? "검색 결과 " : "전체 "}{posts.length}개 · 최신 글 최대 5개
                                    </p>
                                    {posts.length === 0 ? (
                                        <div className="lounge-empty">
                                            <p>{keyword ? "검색어에 맞는 게시글이 없어요." : "아직 등록된 게시글이 없어요."}</p>
                                        </div>
                                    ) : (
                                        <ul className="lounge-feed">
                                            {posts.slice(0, 5).map(function (post) {
                                                return (
                                                    <li key={post.id} className="lounge-feed-item">
                                                        <div className="lounge-feed-body">
                                                            <h3 className="lounge-feed-title">
                                                                <Link to={"/community/post/" + post.id} className="lounge-feed-title-button">
                                                                    {post.title}
                                                                </Link>
                                                            </h3>
                                                            <div className="lounge-feed-meta">
                                                                <span>{post.authorName || "작성자 미등록"}</span>
                                                                <span aria-hidden="true">·</span>
                                                                <span>{formatDate(post.createdAt)}</span>
                                                            </div>
                                                        </div>
                                                        <span className="lounge-feed-arrow" aria-hidden="true">›</span>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    )}
                                </section>
                            );
                        })}
                    </div>

                    <PraiseBox />
                </div>

                {/* 오른쪽: 현황과 안내 */}
                <aside className="lounge-home-side">
                    <section className="lounge-side-card">
                        <h2 className="lounge-side-title">
                            우리들의 이야기
                        </h2>

                        <p className="lounge-side-description">
                            게시판에 모인 이야기를 확인하세요.
                        </p>

                        <div className="lounge-total-posts">
                            <span>전체 게시글</span>
                            <strong>{props.posts.length}개</strong>
                        </div>

                        <ul className="lounge-board-counts">
                            <li>
                                <button
                                    type="button"
                                    className="lounge-board-shortcut"
                                    onClick={openFreeBoard}
                                >
                                    <span>
                                        <span
                                            className="lounge-category-dot lounge-dot-free"
                                            aria-hidden="true"
                                        />
                                        자유게시판
                                    </span>

                                    <strong>{freeCount}개 →</strong>
                                </button>
                            </li>

                            <li>
                                <button
                                    type="button"
                                    className="lounge-board-shortcut"
                                    onClick={openQuestionBoard}
                                >
                                    <span>
                                        <span
                                            className="lounge-category-dot lounge-dot-question"
                                            aria-hidden="true"
                                        />
                                        질문 답변
                                    </span>

                                    <strong>{questionCount}개 →</strong>
                                </button>
                            </li>

                            <li>
                                <button
                                    type="button"
                                    className="lounge-board-shortcut"
                                    onClick={openInfoBoard}
                                >
                                    <span>
                                        <span
                                            className="lounge-category-dot lounge-dot-info"
                                            aria-hidden="true"
                                        />
                                        정보공유
                                    </span>

                                    <strong>{infoCount}개 →</strong>
                                </button>
                            </li>
                        </ul>

                        <button
                            type="button"
                            className="lounge-side-button"
                            onClick={props.onShowBoard}
                        >
                            게시판 둘러보기 →
                        </button>
                    </section>

                    <section className="lounge-side-card">
                        <h2 className="lounge-side-title">
                            함께 지키는 이용 안내
                        </h2>

                        <ul className="lounge-guide-list">
                            <li>
                                <span className="lounge-guide-number">01</span>

                                <div>
                                    <strong>서로 존중해요</strong>
                                    <p>
                                        다른 의견에도 배려하는 말로 대화해주세요.
                                    </p>
                                </div>
                            </li>

                            <li>
                                <span className="lounge-guide-number">02</span>

                                <div>
                                    <strong>정보를 안전하게 나눠요</strong>
                                    <p>
                                        개인정보와 회사의 민감한 정보는 올리지 말아주세요.
                                    </p>
                                </div>
                            </li>

                            <li>
                                <span className="lounge-guide-number">03</span>

                                <div>
                                    <strong>주제에 맞게 작성해요</strong>
                                    <p>
                                        질문은 질문 답변에, 유용한 자료는 정보공유에 남겨주세요.
                                    </p>
                                </div>
                            </li>
                        </ul>
                    </section>

                    <LunchPicker />
                    <ReactionGame />

                    <section className="lounge-welcome-card">
                        <span className="lounge-welcome-label">
                            TOGETHER IS BETTER
                        </span>

                        <h2>작은 이야기도 환영해요.</h2>

                        <p>
                            오늘 알게 된 팁 하나,
                            <br />
                            동료에게 전하고 싶은 한마디.
                            <br />
                            여러분의 이야기로 채워주세요.
                        </p>
                    </section>
                </aside>
            </div>
        </>
    );
}

export default CommunityHome;