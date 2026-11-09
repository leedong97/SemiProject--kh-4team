// 프로젝트 관리 화면에서 쓰는 고정값 모음
// 상태 목록을 바꾸려면 이 파일만 수정하면 됩니다.

// 프로젝트 상태 값 (DB의 status 칼럼 값과 같아야 함)
export const PROJECT_STATUS = {
  PLANNED: "예정",
  IN_PROGRESS: "진행중",
  REQUESTED: "완료 요청",
  DONE: "완료",
  ON_HOLD: "보류",
};

// 상태 선택 목록 (상세 수정 화면의 상태 드롭다운)
export const PROJECT_STATUS_OPTIONS = [
  PROJECT_STATUS.PLANNED,
  PROJECT_STATUS.IN_PROGRESS,
  PROJECT_STATUS.REQUESTED,
  PROJECT_STATUS.DONE,
  PROJECT_STATUS.ON_HOLD,
];

// 새 프로젝트를 만들 때의 기본 상태
export const DEFAULT_PROJECT_STATUS = PROJECT_STATUS.PLANNED;
