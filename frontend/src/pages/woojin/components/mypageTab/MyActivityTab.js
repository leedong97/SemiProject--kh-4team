import { Link } from "react-router-dom";

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
                <div key={n.id} className="mp-card">
                    <p className="mp-item-title">{n.title}</p>
                    <p className="mp-item-sub">{n.date}</p>
                </div>
            ))}
            <Link className="mp-more" to="/Info">공지사항에서 전체 보기 →</Link>

            <p className="mp-note">
                프로토타입: 목록은 예시예요. 이슈관리·공지사항 페이지의 실제 데이터와 연결하려면 담당 팀원과 맞춰야 해요.
            </p>
        </section>
    );
}

export default MyActivityTab;
