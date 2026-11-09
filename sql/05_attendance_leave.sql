-- =====================================================================
-- [팀 공유용] 근태 · 연차 표 2개 만들기 + 더미 데이터 넣기   (작성: 허우진)
-- =====================================================================
-- 이 파일이 하는 일
--   마이페이지 "근태·휴가" 탭에 쓰이는 표 2개를 만들고, 재직 중인 모든 직원에게 더미 데이터를 넣어요.
--     1) leave_balances      : 직원별 · 연도별 "총 연차"   (근속 연수에 따라 차등: 1년 미만 11일, 이후 15일부터 2년마다 +1일, 최대 25일)
--     2) attendance_records  : 직원별 · 날짜별 출근/퇴근 시각 (오늘 기준 최근 30일, 주말 제외, 직급이 높을수록 늦게 퇴근)
--
-- 실행 전에 확인
--   · mydb_v3 에 employees, leave_requests 표가 이미 있어야 해요.
--   · employees 에 employee_hire_date, employee_status, employee_grade 칸이 있어야 해요.
--
-- 실행 순서 (team-mypage-dummy-data.sql 도 같이 쓰는 경우)
--   1) team-mypage-dummy-data.sql 을 먼저 실행해요.
--   2) 그다음에 이 파일을 실행해요.
--   이유: 이 파일은 "승인된 휴가 날짜"를 보고 그날은 출근 기록을 비워요. 휴가 신청(leave_requests)이 먼저 들어가 있어야 그 날짜까지 반영돼요.
--
-- 실행 방법 (DBeaver)
--   1) 새 SQL 편집기에 이 파일 전체를 붙여 넣어요.
--   2) Ctrl+A 로 전체 선택 -> Alt+X (스크립트 실행). Ctrl+Enter 는 한 문장만 실행돼요.
--   3) 맨 아래 확인용 SELECT 2개의 결과가 나오면 성공이에요.
--
-- 여러 번 실행해도 안전해요
--   · CREATE TABLE IF NOT EXISTS / INSERT IGNORE 라서 이미 있는 데이터는 건드리지 않아요.
--   · 더미는 "오늘 기준 최근 30일"로 만들어져요. 날짜가 지나면 새 날짜가 비므로 시연 당일 아침에 한 번 더 실행하세요.
--   · 아래 UPDATE 는 "지난 날인데 퇴근 시각이 비어 있는 기록"만 채워요. 오늘 기록은 건드리지 않아요.
-- =====================================================================
CREATE TABLE IF NOT EXISTS leave_balances (
  employee_id INT NOT NULL,
  balance_year INT NOT NULL,
  total_days DECIMAL(4,1) NOT NULL,
  PRIMARY KEY (employee_id, balance_year),
  CONSTRAINT fk_leave_balances_employee FOREIGN KEY (employee_id) REFERENCES employees (employee_id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS attendance_records (
  record_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  work_date DATE NOT NULL,
  check_in TIME NOT NULL,
  check_out TIME NULL,
  UNIQUE KEY uq_attendance_employee_date (employee_id, work_date),
  CONSTRAINT fk_attendance_employee FOREIGN KEY (employee_id) REFERENCES employees (employee_id) ON DELETE CASCADE
);
INSERT IGNORE INTO leave_balances (employee_id, balance_year, total_days)
SELECT employee_id, YEAR(CURDATE()),
  CASE
    WHEN employee_hire_date IS NULL THEN 15
    WHEN TIMESTAMPDIFF(YEAR, employee_hire_date, CURDATE()) < 1 THEN 11
    ELSE LEAST(25, 15 + FLOOR((TIMESTAMPDIFF(YEAR, employee_hire_date, CURDATE()) - 1) / 2))
  END
FROM employees
WHERE employee_status = '재직';
-- 지난 날인데 퇴근 시각이 비어 있는 기록(어제까지 "오늘"이었던 기록)을 채웁니다. 오늘 기록은 건드리지 않아요.
UPDATE attendance_records r JOIN employees e ON e.employee_id = r.employee_id
SET r.check_out = SEC_TO_TIME(64800 + (CASE e.employee_grade WHEN '사원' THEN 0 WHEN '대리' THEN 10 WHEN '과장' THEN 25 WHEN '차장' THEN 40 WHEN '부장' THEN 55 WHEN '팀장' THEN 60 ELSE 20 END + (e.employee_id * 5 + DAY(r.work_date) * 11) % 50) * 60)
WHERE r.check_out IS NULL AND r.work_date < CURDATE();
INSERT IGNORE INTO attendance_records (employee_id, work_date, check_in, check_out)
SELECT e.employee_id, d.dt,
  SEC_TO_TIME(30600 + ((e.employee_id * 7 + DAY(d.dt) * 3) % 40) * 60),
  IF(d.dt = CURDATE(), NULL, SEC_TO_TIME(64800 + (CASE e.employee_grade WHEN '사원' THEN 0 WHEN '대리' THEN 10 WHEN '과장' THEN 25 WHEN '차장' THEN 40 WHEN '부장' THEN 55 WHEN '팀장' THEN 60 ELSE 20 END + (e.employee_id * 5 + DAY(d.dt) * 11) % 50) * 60))
FROM employees e
JOIN (SELECT CURDATE() - INTERVAL (a.n + 10 * b.n) DAY AS dt FROM (SELECT 0 AS n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) a JOIN (SELECT 0 AS n UNION ALL SELECT 1 UNION ALL SELECT 2) b) d
WHERE e.employee_status = '재직'
  AND WEEKDAY(d.dt) < 5
  AND (e.employee_hire_date IS NULL OR d.dt >= e.employee_hire_date)
  AND (e.employee_id + DAY(d.dt)) % 17 <> 0
  AND NOT EXISTS (SELECT 1 FROM leave_requests l WHERE l.employee_id = e.employee_id AND l.status = '승인' AND d.dt BETWEEN l.start_date AND l.end_date);
-- ----- 확인 -----
SELECT e.employee_grade, MIN(b.total_days) AS min_days, MAX(b.total_days) AS max_days, COUNT(*) AS people FROM leave_balances b JOIN employees e ON e.employee_id = b.employee_id GROUP BY e.employee_grade;
SELECT COUNT(*) AS attendance_rows, COUNT(DISTINCT employee_id) AS people FROM attendance_records;

-- =====================================================================
-- [어떤 아이디에 들어갔나]
--   leave_balances     : employee_status = '재직' 인 모든 직원 (올해 연도 1행씩)
--   attendance_records : employee_status = '재직' 인 모든 직원 (최근 30일 중 평일, 입사일 이후만)
--   제외되는 날         : 주말 / 승인된 휴가 기간 / (employee_id + 날짜의 일) % 17 = 0 인 날(결근처럼 보이게 일부러 비움)
--   특정 번호만 고른 게 아니라 "재직 전원"이라서, 팀원 DB 에서도 번호와 상관없이 똑같이 들어가요.
--   몇 명에게 들어갔는지는 위 확인용 SELECT 두 번째 결과(people)로 볼 수 있어요.
-- =====================================================================