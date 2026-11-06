// 프로젝트 화면 공통 계산 함수
// 진행률을 0~100 사이 숫자로 변환
export const getProgress = (value) => {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return 0;
    }

    return Math.max(0, Math.min(100, number));
};

// 시작일이 종료일보다 늦은지 확인
export const isInvalidDateRange = (startDate, endDate) =>
    Boolean(startDate && endDate && startDate > endDate);