
import React from "react";
import { useParams, Link } from "react-router-dom";

function Info_detail({ info }) {

    // URL에서 공지사항 번호 가져오기
    const { id } = useParams();

    // 해당 번호의 공지사항 찾기
    const notice = info.find((item) =>
        item.id === Number(id)
    );

    // 공지사항이 존재하지 않을 경우
    if (!notice) {
        return <h2>존재하지 않는 공지사항입니다.</h2>;
    }

    return (
        <div className="info-detail">

            <h2>공지사항 상세보기</h2>

            <h3>{notice.title}</h3>

            <p>{notice.content}</p>

            <Link to="/info">목록으로</Link>

        </div>
    );
}

export default Info_detail;
