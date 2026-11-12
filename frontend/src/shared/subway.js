// 프로젝트 표시 공통 도구 (출발 안내판)
// - 프로젝트는 PRJ-012 같은 코드가 첫 식별자예요.
// - 진행 단계 이름은 진척률 구간에서 나와요: 0~24% 착수, 25~49% 설계, 50~74% 개발, 75~99% 테스트, 100% 오픈.
// - 파일 이름(subway.js)과 내보내는 이름은 예전 그대로 둬서, 이걸 쓰는 화면을 고치지 않아도 돼요.

export const STATIONS = ['착수', '설계', '개발', '테스트', '오픈'];
export const LINE_COLORS = ['green', 'sky', 'orange', 'purple', 'navy', 'gold', 'olive'];

export function lineColor(projectId) {
  const n = Math.abs(Number(projectId)) || 0;
  return LINE_COLORS[n % LINE_COLORS.length];
}

export function assignLineColors(projects) {
  const out = {};
  projects.forEach((p) => {
    out[p.id] = lineColor(p.id);
  });
  return out;
}

export function stationIndex(project) {
  if (project.status === '완료') return 4;
  const p = Math.max(0, Math.min(100, Number(project.progress) || 0));
  if (p >= 100) return 4;
  return Math.floor(p / 25);
}

export function projectCode(id) {
  return `PRJ-${String(id).padStart(3, '0')}`;
}

// 프로젝트 상태 → 상태등 (진행 초록, 지연·완료 요청 주황, 완료·보류 회색, 예정 잉크)
export function statusLamp(status) {
  if (status === '진행중' || status === '진행 중') return 'ok';
  if (status === '지연' || status === '완료 요청') return 'late';
  if (status === '완료' || status === '보류') return 'done';
  return 'plan';
}

// 프로젝트 코드표 (예전 원형 노선 번호 자리)
export function LineBadge({ project }) {
  return (
    <span className="cmd-code" aria-hidden="true">
      {projectCode(project.id)}
    </span>
  );
}

// 진척 막대 + 퍼센트 (예전 역 띠 자리)
export function StationStrip({ project }) {
  const progress = Math.max(0, Math.min(100, Number(project.progress) || 0));
  return (
    <span className="cmd-meter" role="img" aria-label={`진척률 ${progress}%, ${STATIONS[stationIndex(project)]} 단계`}>
      <span className="cmd-meter-track" aria-hidden="true">
        <span className="cmd-meter-fill" style={{ width: `${progress}%` }} />
      </span>
      <span className="cmd-meter-text cmd-num" aria-hidden="true">{progress}%</span>
    </span>
  );
}
