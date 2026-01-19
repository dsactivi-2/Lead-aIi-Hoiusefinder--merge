#!/usr/bin/env bash
set -euo pipefail

# Configuration
SERVER="root@178.156.178.70"
SSH_KEY="$HOME/.ssh/id_ed25519_cloudagents"
DB_PATH="/root/cloud-agents/data/app.sqlite"

echo "========================================"
echo "  OPS v0 Pre-Deploy Check"
echo "========================================"
echo ""

# Check SSH key exists
if [ ! -f "$SSH_KEY" ]; then
    echo "ERROR: SSH key not found at $SSH_KEY"
    exit 1
fi

# Test 1: ops_stats (count events)
echo "[1/3] ops_stats..."
STATS=$(ssh -i "$SSH_KEY" -o ConnectTimeout=10 "$SERVER" \
    "sqlite3 -json '$DB_PATH' 'SELECT COUNT(*) as count FROM audit_events'" 2>/dev/null)

if echo "$STATS" | grep -q "count"; then
    COUNT=$(echo "$STATS" | grep -o '"count":[0-9]*' | cut -d: -f2)
    echo "      -> ops_stats OK (${COUNT} events)"
else
    echo "      -> ops_stats FAILED"
    exit 1
fi

# Test 2: ops_events (last 3 events)
echo "[2/3] ops_events..."
EVENTS=$(ssh -i "$SSH_KEY" -o ConnectTimeout=10 "$SERVER" \
    "sqlite3 -json '$DB_PATH' 'SELECT id, kind FROM audit_events ORDER BY ts DESC LIMIT 3'" 2>/dev/null)

if echo "$EVENTS" | grep -q "kind"; then
    echo "      -> ops_events OK"
else
    echo "      -> ops_events FAILED"
    exit 1
fi

# Test 3: ops_tasks_history (tasks table)
echo "[3/3] ops_tasks_history..."
TASKS=$(ssh -i "$SSH_KEY" -o ConnectTimeout=10 "$SERVER" \
    "sqlite3 -json '$DB_PATH' 'SELECT COUNT(*) as count FROM tasks'" 2>/dev/null)

if echo "$TASKS" | grep -q "count"; then
    TASK_COUNT=$(echo "$TASKS" | grep -o '"count":[0-9]*' | cut -d: -f2)
    echo "      -> ops_tasks_history OK (${TASK_COUNT} tasks)"
else
    echo "      -> ops_tasks_history FAILED"
    exit 1
fi

echo ""
echo "========================================"
echo "  OPS v0 Check BESTANDEN"
echo "  Deploy erlaubt"
echo "========================================"
