// 대시보드의 큰 패널 틀 (제목 + 오른쪽 이동 버튼 + 내용)
export default function DashboardPanel({ title, actionLabel, onAction, children }) {
    return (
        <section className="card merge-panel">
            <div className="merge-panel-head">
                <h2>{title}</h2>

                <button type="button"
                    className="btn btn-ghost"
                    onClick={onAction}>
                    {actionLabel}
                </button>
            </div>

            {children}
        </section>
    );
}