#!/bin/bash
set -euo pipefail

CERT_DIR="/etc/letsencrypt/live/zerynecommerce.kro.kr"
BUCKET="zeryn-ssl-backup-2026"
REGION="ap-southeast-2"

# 인증서가 이미 있으면 복원 생략
if [ -s "$CERT_DIR/fullchain.pem" ] && [ -s "$CERT_DIR/privkey.pem" ]; then
    echo "SSL certificate already exists."
    exit 0
fi

echo "Restoring SSL certificate from S3..."

# 임시 작업 폴더 생성
umask 077
WORK_DIR=$(mktemp -d)
trap 'rm -rf "$WORK_DIR"' EXIT

# S3에서 암호화된 백업 다운로드
aws s3 cp \
    "s3://$BUCKET/certificates/zeryn-ssl-backup.tar.gz.enc" \
    "$WORK_DIR/backup.enc" \
    --region "$REGION"

# Parameter Store 비밀번호로 복호화
aws ssm get-parameter \
    --name "/zeryn/ssl/backup-password" \
    --with-decryption \
    --region "$REGION" \
    --query "Parameter.Value" \
    --output text |
openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 \
    -pass stdin \
    -in "$WORK_DIR/backup.enc" \
    -out "$WORK_DIR/backup.tar.gz"

# 기존 인증서 디렉터리 복원
tar -xzf "$WORK_DIR/backup.tar.gz" -C /etc

# 인증서 복원 확인
test -s "$CERT_DIR/fullchain.pem"
test -s "$CERT_DIR/privkey.pem"

echo "SSL certificate restored successfully."
