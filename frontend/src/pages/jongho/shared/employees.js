// 직원 ID로 직원 찾기 (문자열/숫자 ID 차이를 한 곳에서 처리)
export const findEmployee = (employees, id) =>
  employees.find((e) => String(e.id) === String(id));
