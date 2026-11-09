-- [쇼핑몰] 회원 닉네임 추가 + 중복 금지(UNIQUE)
-- 전체를 붙여 넣고 Alt+X 로 실행하세요. (mydb_v3 선택 상태)
-- 이미 한 번 실행했다면 Duplicate 에러가 나는데, 이미 적용됐다는 뜻이라 무시해도 돼요.

ALTER TABLE shop_members ADD COLUMN nickname VARCHAR(20) NULL AFTER member_name;
ALTER TABLE shop_members ADD UNIQUE KEY uq_shop_members_nickname (nickname);
SHOW COLUMNS FROM shop_members LIKE 'nickname';
