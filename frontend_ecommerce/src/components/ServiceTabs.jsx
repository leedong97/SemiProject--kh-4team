/**
 * 두 가지 서비스몰을 전환하는 탭입니다.
 * type: 현재 서비스 유형(system 또는 cloud)
 * onTypeChange: 버튼 클릭 시 App의 type 상태를 바꾸는 함수
 */
export default function ServiceTabs({ type, onTypeChange }) {
  return (
    <div className="togglebar">
      <div className="shell toggle">
        <button
          type="button"
          className={`pill ${type === "system" ? "selected" : ""}`}
          onClick={() => onTypeChange("system")}
          aria-pressed={type === "system"}
        >
          ① 업무 시스템 구축몰
        </button>
        <button
          type="button"
          className={`pill ${type === "cloud" ? "selected" : ""}`}
          onClick={() => onTypeChange("cloud")}
          aria-pressed={type === "cloud"}
        >
          ② 클라우드·보안몰
        </button>
      </div>
    </div>
  );
}
