import React from "react";

function CommunityMenu(props) {

    function showHome() {
        props.changeMenu("커뮤니티 홈");
    }

    function showBoard() {
        props.changeMenu("게시판");
    }

    function showActivity() {
        props.changeMenu("내 활동");
    }

    let homeClass = "community-menu-button";
    let boardClass = "community-menu-button";
    let activityClass = "community-menu-button";

    if (props.menu === "커뮤니티 홈") {
        homeClass += " community-menu-selected";
    } else if (props.menu === "게시판") {
        boardClass += " community-menu-selected";
    } else if (props.menu === "내 활동") {
        activityClass += " community-menu-selected";
    }

    return (

        <div className="community-side-menu">
            <button
                type="button"
                className={homeClass}
                onClick={showHome}
            >
                커뮤니티 홈
            </button>

            <button
                type="button"
                className={boardClass}
                onClick={showBoard}
            >
                게시판
            </button>

            <button
                type="button"
                className={activityClass}
                onClick={showActivity}
            >
                내 활동
            </button>
        </div>

    );
}

export default CommunityMenu;