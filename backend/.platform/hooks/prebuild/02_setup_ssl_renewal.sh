#!/bin/bash
set -euo pipefail

# Certbot 자동 갱신 후 실행할 백업 스크립트
HOOK="/etc/letsencrypt/renewal-hooks/deploy/backup-to-s3.sh"

mkdir -p /etc/letsencrypt/renewal-hooks/deploy

cat > "$HOOK" <<'SCRIPT'
#!/bin/bash
set -euo pipefail
umask 077

WORK_DIR=$(mktemp -d)
trap 'rm -rf "$WORK_DIR"' EXIT

# 갱신된 인증서를 Nginx에 반영
systemctl reload nginx

# 인증서 및 갱신 설정 백업
tar -czf "$WORK_DIR/backup.tar.gz" -C /etc letsencrypt

# Parameter Store에서 비밀번호를 읽어 백업 암호화
aws ssm get-parameter \
  --name "/zeryn/ssl/backup-password" \
  --with-decryption \
  --region ap-southeast-2 \
  --query "Parameter.Value" \
  --output text |
openssl enc -aes-256-cbc -salt -pbkdf2 -iter 200000 \
  -pass stdin \
  -in "$WORK_DIR/backup.tar.gz" \
  -out "$WORK_DIR/backup.enc"

# 새 백업을 S3에 업로드
aws s3 cp "$WORK_DIR/backup.enc" \
  s3://zeryn-ssl-backup-2026/certificates/zeryn-ssl-backup.tar.gz.enc \
  --region ap-southeast-2
SCRIPT

chmod 700 "$HOOK"

# 자동 갱신 활성화
systemctl daemon-reload
systemctl enable --now certbot-renew.timer

echo "SSL automatic renewal and S3 backup configured."