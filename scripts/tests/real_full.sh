#!/usr/bin/env bash
set -euo pipefail

# Full integration: includes smoke + negative tests + stats.

"$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/real_smoke.sh"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TOKEN="test_token"

# negative: missing fields should 400
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8080/memory/append \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"type":"x"}')
if [ "$CODE" != "400" ]; then
  echo "FAIL: expected 400, got $CODE" >&2
  exit 1
fi

# stats
STATS=$(curl -fsS http://localhost:8080/memory/stats -H "Authorization: Bearer $TOKEN")
python - <<PY
import json,sys
s=json.loads(sys.argv[1])
assert 'total' in s and 'by_type' in s
print('OK: stats total', s['total'])
PY "$STATS"

echo "FULL PASS"
