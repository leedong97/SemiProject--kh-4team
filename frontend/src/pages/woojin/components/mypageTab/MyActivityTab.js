import { Link } from "react-router-dom";

// 내 활동 탭 (이슈·공지)
function MyActivityTab({ myIssues, myNotices }) {
    return (
        <section className="mp-panel">
            <h3>내가 등록한 이슈</h3>
            {myIssues.length === 0 && <p className="mp-empty">등록한 이슈가 없어요.</p>}
            {myIssues.map((i) => (
                <div key={i.id} className="mp-card mp-task">
                    <div>
                        <p className="mp-item-title">{i.title}</p>
                        <p className="mp-item-sub">{i.date}</p>
                    </div>
                    <span className={`mp-badge s-${i.status === "완료" ? "done" : "doing"}`}>
                        {i.status}
                    </span>
                </div>
            ))}
            <Link className="mp-more" to="/Issue">이슈관리에서 전체 보기 →</Link>

            <h3>내가 등록한 공지</h3>
            {myNotices.length === 0 && <p className="mp-empty">등록한 공지가 없어요.</p>}
            {myNotices.map((n) => (
                <div key={n.id} className="mp-card mp-task">
                    <div>
                        <p className="mp-item-title">{n.title}</p>
                        <p className="mp-item-sub">{n.date}</p>
                    </div>
                    {n.pinned && <span className="mp-badge s-pin">📌 고정</span>}
                </div>
            ))}
            <Link className="mp-more" to="/Info">공지사항에서 전체 보기 →</Link>
        </section>
    );
}

export default MyActivityTab;
