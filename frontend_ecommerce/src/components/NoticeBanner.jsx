/** 여러 페이지에서 공통으로 쓰는 안내/이동 배너입니다. */
export default function NoticeBanner({ title, description, buttonText, onClick }) {
  return (
    <div className="notice">
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <button type="button" className="btn" onClick={onClick}>
        {buttonText}
      </button>
    </div>
  );
}
