#!/bin/bash
# =============================================================================
# post_run.sh - Post-Run Processing for Agent Reports
# =============================================================================
# Usage: ./scripts/post_run.sh --agent <name> --json <path>
#
# This script:
# 1. Validates the run report JSON against schema
# 2. Scans for secrets (failsafe)
# 3. Appends open_questions to ops/OPEN_QUESTIONS.md
# 4. Sends memory events to Master-Brain (if BRAIN_URL is set)
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SCHEMA_PATH="$REPO_ROOT/schemas/RUN_REPORT_SCHEMA.json"
OPEN_QUESTIONS_PATH="$REPO_ROOT/ops/OPEN_QUESTIONS.md"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# =============================================================================
# Parse arguments
# =============================================================================
AGENT=""
JSON_PATH=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --agent)
            AGENT="$2"
            shift 2
            ;;
        --json)
            JSON_PATH="$2"
            shift 2
            ;;
        -h|--help)
            echo "Usage: $0 --agent <agent_name> --json <path_to_report.json>"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

if [[ -z "$AGENT" || -z "$JSON_PATH" ]]; then
    echo -e "${RED}ERROR: --agent and --json are required${NC}"
    echo "Usage: $0 --agent <agent_name> --json <path_to_report.json>"
    exit 1
fi

if [[ ! -f "$JSON_PATH" ]]; then
    echo -e "${RED}ERROR: JSON file not found: $JSON_PATH${NC}"
    exit 1
fi

echo "============================================================"
echo -e "${BLUE}Post-Run Processing${NC}"
echo "============================================================"
echo "Agent: $AGENT"
echo "Report: $JSON_PATH"
echo ""

# =============================================================================
# 1. Validate JSON against schema
# =============================================================================
echo -e "${BLUE}[1/4] Validating JSON schema...${NC}"

python3 - "$JSON_PATH" "$SCHEMA_PATH" << 'PYTHON_VALIDATOR'
import sys
import json

json_path = sys.argv[1]
schema_path = sys.argv[2]

try:
    with open(json_path, 'r') as f:
        data = json.load(f)
    with open(schema_path, 'r') as f:
        schema = json.load(f)
except json.JSONDecodeError as e:
    print(f"INVALID JSON: {e}")
    sys.exit(1)
except FileNotFoundError as e:
    print(f"FILE NOT FOUND: {e}")
    sys.exit(1)

# Basic validation (required fields)
required = schema.get("required", [])
missing = [k for k in required if k not in data]

if missing:
    print(f"MISSING REQUIRED FIELDS: {', '.join(missing)}")
    sys.exit(1)

# Check redactions_done is true
if not data.get("redactions_done", False):
    print("ERROR: redactions_done must be true")
    sys.exit(1)

print("VALID")
sys.exit(0)
PYTHON_VALIDATOR

if [[ $? -ne 0 ]]; then
    echo -e "${RED}  FAILED - Schema validation error${NC}"
    exit 1
fi
echo -e "${GREEN}  PASSED${NC}"

# =============================================================================
# 2. Scan for secrets (failsafe)
# =============================================================================
echo -e "${BLUE}[2/4] Scanning for secrets...${NC}"

SECRET_PATTERNS=(
    'API_KEY='
    'sk-[a-zA-Z0-9]'
    'ghp_[a-zA-Z0-9]'
    'gho_[a-zA-Z0-9]'
    'glpat-[a-zA-Z0-9]'
    'PRIVATE KEY-----'
    'password.*='
    'secret.*='
    'token.*='
)

FOUND_SECRETS=0
for pattern in "${SECRET_PATTERNS[@]}"; do
    if grep -qiE "$pattern" "$JSON_PATH" 2>/dev/null; then
        echo -e "${RED}  POTENTIAL SECRET FOUND: pattern '$pattern'${NC}"
        FOUND_SECRETS=1
    fi
done

if [[ $FOUND_SECRETS -eq 1 ]]; then
    echo -e "${RED}  FAILED - Remove secrets before proceeding${NC}"
    exit 1
fi
echo -e "${GREEN}  PASSED${NC}"

# =============================================================================
# 3. Append open_questions to ops/OPEN_QUESTIONS.md
# =============================================================================
echo -e "${BLUE}[3/4] Processing open questions...${NC}"

python3 - "$JSON_PATH" "$OPEN_QUESTIONS_PATH" "$AGENT" << 'PYTHON_QUESTIONS'
import sys
import json
from datetime import datetime

json_path = sys.argv[1]
oq_path = sys.argv[2]
agent = sys.argv[3]

with open(json_path, 'r') as f:
    data = json.load(f)

open_questions = data.get("open_questions", [])
refs = data.get("refs", [])
run_id = data.get("run_id", "unknown")

if not open_questions:
    print("No open questions to log.")
    sys.exit(0)

timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
ref_list = ", ".join([f"{r['type']}:{r['value']}" for r in refs[:3]]) if refs else "none"

entries = []
for q in open_questions:
    priority = q.get("priority", "medium")
    blocking = "BLOCKING" if q.get("blocking", False) else ""
    entries.append(f"""
## [{timestamp}] Open Question from {agent}

- **Run ID:** `{run_id}`
- **Question:** {q.get('question', 'N/A')}
- **Context:** {q.get('context', 'N/A')}
- **Priority:** {priority} {blocking}
- **Refs:** {ref_list}
- **Action:** Review and resolve

---
""")

with open(oq_path, "a") as f:
    for entry in entries:
        f.write(entry)

print(f"Logged {len(entries)} open question(s) to {oq_path}")
sys.exit(0)
PYTHON_QUESTIONS

echo -e "${GREEN}  Done${NC}"

# =============================================================================
# 4. Send to Master-Brain (if configured)
# =============================================================================
echo -e "${BLUE}[4/4] Sending to Master-Brain...${NC}"

# Load .env if exists
if [[ -f "$REPO_ROOT/.env" ]]; then
    export $(grep -v '^#' "$REPO_ROOT/.env" | xargs)
fi

if [[ -z "$BRAIN_URL" ]]; then
    echo -e "${YELLOW}  SKIPPED - BRAIN_URL not set in .env${NC}"
    echo "  (Run reports saved locally, sync when Brain API is available)"
else
    # Send decisions, learnings, open_questions as memory events
    python3 - "$JSON_PATH" "$BRAIN_URL" "${BRAIN_TOKEN:-}" "$AGENT" << 'PYTHON_BRAIN'
import sys
import json
import urllib.request
import urllib.error

json_path = sys.argv[1]
brain_url = sys.argv[2]
brain_token = sys.argv[3] if len(sys.argv) > 3 else ""
agent = sys.argv[4] if len(sys.argv) > 4 else "unknown"

with open(json_path, 'r') as f:
    data = json.load(f)

# Prepare memory events
events = []

# Decisions -> memory
for d in data.get("decisions", []):
    events.append({
        "type": "decision",
        "agent": agent,
        "run_id": data.get("run_id"),
        "content": d.get("decision"),
        "rationale": d.get("rationale"),
        "timestamp": data.get("timestamp")
    })

# Learnings -> memory
for l in data.get("learnings", []):
    events.append({
        "type": "learning",
        "agent": agent,
        "run_id": data.get("run_id"),
        "content": l.get("learning"),
        "category": l.get("category"),
        "timestamp": data.get("timestamp")
    })

# Open questions -> memory
for q in data.get("open_questions", []):
    events.append({
        "type": "open_question",
        "agent": agent,
        "run_id": data.get("run_id"),
        "content": q.get("question"),
        "priority": q.get("priority", "medium"),
        "blocking": q.get("blocking", False),
        "timestamp": data.get("timestamp")
    })

# Risks -> memory
for r in data.get("risks", []):
    events.append({
        "type": "risk",
        "agent": agent,
        "run_id": data.get("run_id"),
        "content": r.get("risk"),
        "severity": r.get("severity", "medium"),
        "timestamp": data.get("timestamp")
    })

if not events:
    print("No events to send.")
    sys.exit(0)

# Send to Brain API
endpoint = f"{brain_url.rstrip('/')}/memory/append"
headers = {"Content-Type": "application/json"}
if brain_token:
    headers["Authorization"] = f"Bearer {brain_token}"

# Send each event as a single append call (Brain API expects {type, content, tags, refs})
sent = 0
for ev in events:
    payload_obj = {
        "type": ev.get("type"),
        "content": ev.get("content"),
        "tags": ["agent:" + str(ev.get("agent")), "run:" + str(ev.get("run_id"))],
        "refs": [
            {"type": "run_id", "value": str(ev.get("run_id"))},
            {"type": "agent", "value": str(ev.get("agent"))}
        ]
    }
    payload = json.dumps(payload_obj).encode('utf-8')
    try:
        req = urllib.request.Request(endpoint, data=payload, headers=headers, method='POST')
        with urllib.request.urlopen(req, timeout=10) as resp:
            _ = resp.read()
            sent += 1
    except urllib.error.URLError as e:
        print(f"WARNING: Could not reach Brain API: {e}")
        break
    except Exception as e:
        print(f"WARNING: Brain API error: {e}")
        break

if sent:
    print(f"SUCCESS: Sent {sent}/{len(events)} events to Brain")
else:
    print("WARNING: No events sent to Brain")

sys.exit(0)
PYTHON_BRAIN

    echo -e "${GREEN}  Done${NC}"
fi

# =============================================================================
# Summary
# =============================================================================
echo ""
echo "============================================================"
echo -e "${GREEN}Post-Run Processing Complete${NC}"
echo "============================================================"
echo "Report validated and processed successfully."
echo ""
echo "Next steps:"
echo "  1. git add runs/ ops/OPEN_QUESTIONS.md"
echo "  2. git commit -m 'Add run report for $AGENT'"
echo "  3. git push"
echo ""
