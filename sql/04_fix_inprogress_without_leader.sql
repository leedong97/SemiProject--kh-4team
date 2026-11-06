-- =====================================================================
--  담당자(팀장 이상, 재직)가 없는데 '진행중'인 프로젝트를 '예정'으로 바꾼다.
--  1) 먼저 대상 확인 (SELECT)  2) 확인 후 UPDATE 실행
--  담당자 칸(manager_id)은 그대로 둔다. 필요하면 인원 관리 화면에서 다시 배정.
-- =====================================================================
USE mydb_v3;

-- 1) 대상 확인
SELECT p.project_id, p.project_title, p.status, p.manager_id,
       e.employee_name, e.employee_grade, e.employee_status
FROM projects p
LEFT JOIN employees e ON e.employee_id = p.manager_id
WHERE p.status = '진행중'
  AND (p.manager_id IS NULL
       OR e.employee_id IS NULL
       OR e.employee_status <> '재직'
       OR e.employee_grade NOT IN ('팀장','실장','부장','이사','상무','전무','대표'));

-- 2) 상태 변경 (위 결과를 확인한 뒤 실행)
UPDATE projects p
LEFT JOIN employees e ON e.employee_id = p.manager_id
SET p.status = '예정'
WHERE p.status = '진행중'
  AND (p.manager_id IS NULL
       OR e.employee_id IS NULL
       OR e.employee_status <> '재직'
       OR e.employee_grade NOT IN ('팀장','실장','부장','이사','상무','전무','대표'));
