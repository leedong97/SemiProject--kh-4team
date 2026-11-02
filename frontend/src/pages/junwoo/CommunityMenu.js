import React from "react";
import { Link } from "react-router-dom";

function CommunityMenu(props) {
    let homeClass = "community-menu-button";
    let boardClass = "community-menu-button";
    let activityClass = "community-menu-button";

    if (props.menu === "커뮤니티 홈") {
        homeClass += " community-menu-selected";
    }

    if (props.menu === "게시판") {
        boardClass += " community-menu-selected";
    }

    if (props.menu === "내 활동") {
        activityClass += " community-menu-selected";
    }

    return (
        <div className="community-side-menu">
            <Link
                to="/community"
                className={homeClass}
            >
                커뮤니티 홈
            </Link>

            <Link
                to="/community/board"
                className={boardClass}
            >
                게시판
            </Link>

            <Link
                to="/community/activity"
                className={activityClass}
            >
                내 활동
            </Link>
        </div>
    );
}

export default CommunityMenu;