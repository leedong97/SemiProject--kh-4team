-- [쇼핑몰] 전화번호 중복 금지(UNIQUE)
-- 전체를 붙여 넣고 Alt+X 로 실행하세요. (mydb_v3 선택 상태)
-- 이미 한 번 실행했다면 Duplicate key name 에러가 나는데, 이미 적용됐다는 뜻이라 무시해도 돼요.
-- 전화번호는 비워 둘 수 있어요(NULL). UNIQUE 는 NULL 이 여러 개여도 괜찮아요.

-- 1) 빈 글자('')로 들어간 번호가 있으면 NULL 로 바꿔요 ('' 끼리는 중복으로 걸리기 때문)
UPDATE shop_members SET phone = NULL WHERE phone = '';

-- 2) 같은 번호가 이미 둘 이상 있는지 확인 (결과가 0줄이어야 3번이 성공해요)
SELECT phone, COUNT(*) AS cnt FROM shop_members WHERE phone IS NOT NULL GROUP BY phone HAVING COUNT(*) > 1;

-- 3) 전화번호 중복 금지
ALTER TABLE shop_members ADD UNIQUE KEY uq_shop_members_phone (phone);

-- 4) 확인
SHOW INDEX FROM shop_members WHERE Key_name = 'uq_shop_members_phone';
