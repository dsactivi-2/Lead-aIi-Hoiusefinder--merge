#!/bin/bash
# Secrets Scanner
# Prüft ob Secrets im Code sind

set -e

echo "🔐 Secrets Scan"
echo "==============="

FOUND=0

# OpenAI Keys
echo -n "OpenAI Keys... "
if grep -rn 'sk-[a-zA-Z0-9]\{20,\}' --include="*.js" --include="*.ts" --include="*.json" --include="*.env" . 2>/dev/null | grep -v ".env.example" | grep -v "node_modules"; then
    echo "❌ GEFUNDEN!"
    FOUND=1
else
    echo "✅ Keine"
fi

# GitHub Tokens
echo -n "GitHub Tokens... "
if grep -rn 'ghp_[a-zA-Z0-9]\{36,\}\|gho_[a-zA-Z0-9]\{36,\}' --include="*.js" --include="*.ts" --include="*.json" . 2>/dev/null | grep -v "node_modules"; then
    echo "❌ GEFUNDEN!"
    FOUND=1
else
    echo "✅ Keine"
fi

# AWS Keys
echo -n "AWS Keys... "
if grep -rn 'AKIA[0-9A-Z]\{16\}' --include="*.js" --include="*.ts" --include="*.json" . 2>/dev/null | grep -v "node_modules"; then
    echo "❌ GEFUNDEN!"
    FOUND=1
else
    echo "✅ Keine"
fi

# Private Keys
echo -n "Private Keys... "
if grep -rn 'PRIVATE KEY' --include="*.js" --include="*.ts" --include="*.pem" --include="*.key" . 2>/dev/null | grep -v "node_modules"; then
    echo "❌ GEFUNDEN!"
    FOUND=1
else
    echo "✅ Keine"
fi

# Passwords in Code
echo -n "Hardcoded Passwords... "
if grep -rn 'password\s*=\s*['"'"'"][^'"'"'"]\+['"'"'"]' --include="*.js" --include="*.ts" . 2>/dev/null | grep -v "node_modules" | grep -v ".example" | grep -v "test"; then
    echo "⚠️ Möglich (manuell prüfen)"
else
    echo "✅ Keine offensichtlichen"
fi

# .env Dateien (außer .example)
echo -n ".env Dateien im Repo... "
if find . -name ".env" -o -name ".env.local" -o -name ".env.production" 2>/dev/null | grep -v ".example" | head -5; then
    echo "⚠️ GEFUNDEN (sollten in .gitignore sein)"
else
    echo "✅ Keine"
fi

echo ""
echo "==============="
if [ $FOUND -eq 1 ]; then
    echo "❌ Secrets gefunden! Bitte entfernen und rotieren."
    exit 1
else
    echo "✅ Keine offensichtlichen Secrets gefunden"
fi
