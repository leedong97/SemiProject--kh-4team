import React from "react";
import { Link } from "react-router-dom";

// 게시판 목록 위 머리줄: 게시판 이름(노선색 점) + 한 줄 소개 + 글쓰기
const BOARD_INFO = {
    "자유게시판": { key: "free", description: "소소한 일상부터 재미있는 이야기까지" },
    "질문 답변": { key: "question", description: "혼자 고민하지 말고 함께 해결해요" },
    "정보공유": { key: "info", description: "알아두면 유용한 정보를 나눠요" }
};

function BoardBanner(props) {
    const info = BOARD_INFO[props.boardName] || BOARD_INFO["자유게시판"];

    return (
        <div className="board-intro">
            <div className="board-intro-text">
                <h2>
                    <span className={"lounge-category-dot lounge-dot-" + info.key} aria-hidden="true" />
                    {props.boardName}
                </h2>
            </div>

            <Link to={props.writeAddress} className="board-write-link">
                글쓰기
            </Link>
        </div>
    );
}

export default BoardBanner;
