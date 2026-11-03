-- 달력(대시보드)에 공지/일정을 표시하려면 notices 테이블에 event_date 컬럼이 필요해요.
-- 1) 먼저 있는지 확인:   SHOW COLUMNS FROM notices LIKE 'event_date';   (결과가 비어 있으면 없는 것)
-- 2) 없을 때만 실행:
USE mydb_v3;
ALTER TABLE notices ADD COLUMN event_date DATE NULL;
