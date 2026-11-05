import React from "react";
import { Link } from "react-router-dom";

function BoardBanner(props) {
    // 기본값: 자유게시판
    let description = "소소한 일상부터 재미있는 이야기까지";
    let icon = "💬";

    if (props.boardName === "질문 답변") {
        description = "혼자 고민하지 말고 함께 해결해요";
        icon = "❔";
    } else if (props.boardName === "정보공유") {
        description = "알아두면 유용한 정보를 나눠요";
        icon = "💡";
    }

    return (
        <div className="board-intro">
            <div className="board-intro-text">
                <span className="board-intro-label">
                    OUR COMMUNITY
                </span>

                <h2>{props.boardName}</h2>

                <p>{description}</p>
            </div>

            <div className="board-intro-right">
                <span className="board-intro-icon" aria-hidden="true">
                    {icon}
                </span>

                <Link
                    to={props.writeAddress}
                    className="board-write-link"
                >
                    + 글쓰기
                </Link>
            </div>
        </div>
    );
}

export default BoardBanner;