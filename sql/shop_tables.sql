-- 쇼핑몰 고객 테이블 (직원 employees 와 완전히 분리)
CREATE TABLE IF NOT EXISTS shop_members (
  member_id     INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  member_name   VARCHAR(50)  NOT NULL,
  email         VARCHAR(200) NULL,            -- 소셜 가입은 이메일이 없을 수 있어 NULL 허용 (UNIQUE 는 NULL 여러 개 OK)
  password_hash VARCHAR(100) NULL,            -- 소셜 전용 계정은 NULL
  phone         VARCHAR(20)  NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_shop_members_email (email)
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
