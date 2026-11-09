// 상세/견적 화면의 '서비스 전체 / 현재 위치' 경로를 표시합니다.
export default function Breadcrumb({ children, onHome }) {
  return (
    <div className="crumb">
      <button type="button" className="back" onClick={onHome}>서비스 전체</button>
      {" / "}{children}
    </div>
  );
}
