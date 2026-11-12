// 알림 탭: 나에게 온 소식(이슈·프로젝트 상태 변경 등)을 목록으로 보여줘요
// 종류(type)별 칩 색 (노선색). 없는 종류는 회색
const TYPE_TONE = { "이슈": "orange", "프로젝트": "green", "휴가": "red" };

function NotificationTab({ notifications, onRead, onReadAll }) {
    // 안 읽은 알림 개수 (isRead 가 false 인 것만 센다)
    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return (
        <section className="mp-panel">
            <h3>
                알림
                {unreadCount > 0 && <span className="mp-noti-count">안 읽은 알림 {unreadCount}개</span>}
                {unreadCount > 0 && (
                    <button type="button" className="mp-noti-readall" onClick={onReadAll}>
                        모두 읽음
                    </button>
                )}
            </h3>

            {notifications.length === 0 && <p className="mp-empty">새 알림이 없어요.</p>}

            {notifications.map((n) => (
                // 안 읽은 알림이면 unread 클래스를 더 붙여서 눈에 띄게 하고, 누르면 읽음 처리해요
                <div
                    key={n.id}
                    className={n.isRead ? "mp-noti" : "mp-noti unread"}
                    onClick={() => !n.isRead && onRead(n.id)}
                >
                    <span className={"mp-noti-icon cmd-chip tone-" + (TYPE_TONE[n.type] || "grey")}>{n.type || "알림"}</span>
                    <div className="mp-noti-body">
                        <p className="mp-noti-msg">{n.message}</p>
                        <p className="mp-noti-time">{n.time}</p>
                    </div>
                    {/* 안 읽은 알림만 오른쪽에 파란 점 */}
                    {!n.isRead && <span className="mp-noti-dot" aria-label="안 읽음" />}
                </div>
            ))}
        </section>
    );
}

export default NotificationTab;
