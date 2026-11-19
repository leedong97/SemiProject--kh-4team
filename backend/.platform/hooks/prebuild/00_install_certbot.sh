#!/bin/bash
set -euo pipefail

# 새 EC2에 Certbot이 없으면 설치
if ! command -v certbot >/dev/null 2>&1; then
    dnf install -y certbot
fi

# AWS CLI가 없으면 설치
if ! command -v aws >/dev/null 2>&1; then
    dnf install -y awscli-2
fi

# Let's Encrypt 인증서 갱신에 사용할 폴더
mkdir -p /var/www/letsencrypt/.well-known/acme-challenge