// 우선도 표시 (긴급 빨강 / 높음 주황 / 보통 회색 / 낮음 옅은 회색)
// 색은 shared/components.css 의 .cmd-prio 에서 정해요.
export function Priority({ value }) {
  const v = value || '보통';
  return (
    <span className="cmd-prio" data-prio={v}>
      {v}
    </span>
  );
}

export default Priority;
