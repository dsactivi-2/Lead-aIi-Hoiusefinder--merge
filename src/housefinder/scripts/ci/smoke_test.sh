#!/bin/bash
# Smoke Test gegen Live-URL
# Usage: ./smoke_test.sh https://your-app.com

set -e

URL="${1:-http://localhost:8080}"

echo "🔍 Smoke Test gegen: $URL"
echo "================================"

# Health Check
echo -n "Health Check... "
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "$URL/health")
if [ "$HEALTH" = "200" ]; then
    echo "✅ OK ($HEALTH)"
else
    echo "❌ FAILED ($HEALTH)"
    exit 1
fi

# API Docs
echo -n "API Docs... "
DOCS=$(curl -s -o /dev/null -w "%{http_code}" "$URL/api-docs")
if [ "$DOCS" = "200" ]; then
    echo "✅ OK ($DOCS)"
else
    echo "⚠️ Not found ($DOCS)"
fi

# 404 Handling
echo -n "404 Handling... "
NOT_FOUND=$(curl -s -o /dev/null -w "%{http_code}" "$URL/nonexistent-endpoint-12345")
if [ "$NOT_FOUND" = "404" ]; then
    echo "✅ OK ($NOT_FOUND)"
else
    echo "⚠️ Unexpected ($NOT_FOUND)"
fi

# Health Response Format
echo -n "Health Response Format... "
HEALTH_BODY=$(curl -s "$URL/health")
if echo "$HEALTH_BODY" | grep -q '"status"'; then
    echo "✅ OK"
else
    echo "⚠️ Unexpected format"
fi

echo ""
echo "================================"
echo "✅ Smoke Test abgeschlossen"
