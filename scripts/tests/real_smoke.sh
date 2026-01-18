#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMPOSE="$ROOT/infra/docker-compose.yml"

export BRAIN_DB_PASSWORD="test_pw"
export BRAIN_API_TOKEN="test_token"
export COMPOSE_PROJECT_NAME="brain_ci_${GITHUB_RUN_ID:-local}"

cleanup() {
  docker compose -f "$COMPOSE" down -v --remove-orphans >/dev/null 2>&1 || true
}
trap cleanup EXIT

docker compose -f "$COMPOSE" up -d --build

# wait for health
for i in {1..60}; do
  if curl -fsS http://localhost:8080/health >/dev/null 2>&1; then
    break
  fi
  sleep 2
  if [ "$i" -eq 60 ]; then
    echo "FAIL: /health not ready" >&2
    exit 1
  fi
done

echo "OK: health"

# append
CONTENT="smoke-$(date +%s)"
RESP=$(curl -fsS -X POST http://localhost:8080/memory/append \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $BRAIN_API_TOKEN" \
  -d "{\"type\":\"smoke\",\"content\":\"$CONTENT\",\"tags\":[\"ci\"],\"refs\":[]}")

python - <<PY
import json,sys
r=json.loads(sys.argv[1])
assert 'id' in r and 'content' in r
print('OK: append id', r['id'])
PY "$RESP"

# recent
REC=$(curl -fsS "http://localhost:8080/memory/recent?limit=10" \
  -H "Authorization: Bearer $BRAIN_API_TOKEN")

python - <<PY
import json,sys
arr=json.loads(sys.argv[1])
assert isinstance(arr,list)
print('OK: recent count', len(arr))
PY "$REC"

# readback check (content present)
python - <<PY
import json,sys
arr=json.loads(sys.argv[1])
content=sys.argv[2]
if not any((row.get('content')==content) for row in arr):
    raise SystemExit('FAIL: content not found in recent')
print('OK: readback found')
PY "$REC" "$CONTENT"

echo "SMOKE PASS"
