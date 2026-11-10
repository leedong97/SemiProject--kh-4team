// 목록 정렬 공용 함수 (프로젝트 관리·인원 관리·커뮤니티 관리에서 같이 쓴다)
//
// 사용법: 정렬 선택값마다 비교 함수(규칙)를 만들어 두고 sortByOption 에 넘긴다.
//   const rules = { name: (a, b) => compareText(a.name, b.name), ... };
//   const sorted = sortByOption(items, sortOption, rules);

// 글자 비교 (한글 가나다순). 빈 값(null, undefined)은 빈 문자열로 본다.
export const compareText = (a, b) =>
    String(a ?? "").localeCompare(String(b ?? ""), "ko");
  
  // 숫자 비교 (작은 값이 앞). 숫자가 아니면 0으로 본다.
  export const compareNumber = (a, b) =>
    (Number(a) || 0) - (Number(b) || 0);
  
  // 날짜 문자열 비교 (YYYY-MM-DD). 빈 값은 항상 맨 뒤로 보낸다.
  export const compareDate = (a, b) => {
    if (!a && !b) return 0;
    if (!a) return 1;
    if (!b) return -1;
    return String(a).localeCompare(String(b));
  };
  
  // 비교 방향을 뒤집는다 (내림차순)
  export const descending = (compare) => (a, b) => compare(b, a);
  
  // 선택한 정렬 규칙으로 목록을 복사해서 정렬한다.
  // 선택값에 규칙이 없으면 원래 순서를 그대로 유지한다.
  export function sortByOption(items, option, rules) {
    const rule = rules[option];
    return rule ? [...items].sort(rule) : [...items];
  }