-- 쇼핑몰 고객 테이블 (직원 employees 와 완전히 분리)
CREATE TABLE IF NOT EXISTS shop_members (
  member_id     INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  member_name   VARCHAR(50)  NOT NULL,
  nickname      VARCHAR(20)  NULL,            -- 닉네임(중복 금지). 구글 가입은 가입 직후 정하므로 잠깐 NULL 일 수 있어요
  email         VARCHAR(200) NULL,            -- 소셜 가입은 이메일이 없을 수 있어 NULL 허용 (UNIQUE 는 NULL 여러 개 OK)
  password_hash VARCHAR(100) NULL,            -- 소셜 전용 계정은 NULL
  phone         VARCHAR(20)  NULL,            -- 010-1234-5678 형식으로 저장 (중복 금지, 비워 두면 NULL)
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_shop_members_email (email),
  UNIQUE KEY uq_shop_members_nickname (nickname),
  UNIQUE KEY uq_shop_members_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 소셜 로그인 연결 (구글 sub / 네이버 id 를 provider_user_id 에 저장)
CREATE TABLE IF NOT EXISTS social_accounts (
  social_id        INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  member_id        INT UNSIGNED NOT NULL,
  provider         ENUM('google','naver') NOT NULL,
  provider_user_id VARCHAR(100) NOT NULL,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_social_provider_user (provider, provider_user_id),
  CONSTRAINT fk_social_member FOREIGN KEY (member_id) REFERENCES shop_members(member_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ※ 이미 shop_members 표가 있는 DB 는 위 CREATE 가 아무것도 안 바꿔요. 닉네임 칸은 06_shop_nickname.sql 로, 전화번호 중복 금지는 07_shop_phone_unique.sql 로 추가하세요.
