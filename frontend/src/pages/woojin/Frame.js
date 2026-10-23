import './woojin.css';

// 로그인·회원가입·마이페이지 바깥 틀 (팀 메뉴바 없이 가운데 정렬 + 배경)
function Frame({ children }) {
  return <div className="woojin-frame">{children}</div>;
}

export default Frame;
