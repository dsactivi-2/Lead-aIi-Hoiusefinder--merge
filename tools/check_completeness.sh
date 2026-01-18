#!/usr/bin/env bash
set -euo pipefail

base_dir="$(cd "$(dirname "$0")/.." && pwd)"

required_paths=(
  "$base_dir/memory"
  "$base_dir/templates"
  "$base_dir/tools"
  "$base_dir/playbooks"
  "$base_dir/memory/PROJECT_MEMORY.md"
  "$base_dir/memory/DECISIONS.md"
  "$base_dir/memory/MEETING_LOG.md"
  "$base_dir/memory/CHAT_SEED_2026-01-13.md"
  "$base_dir/memory/BRAIN_CONSTITUTION.md"
  "$base_dir/templates/WORKING_SUMMARY.md"
  "$base_dir/templates/DECISION_RECORD.md"
  "$base_dir/templates/TASK_TICKET.md"
  "$base_dir/templates/INTAKE_COMPLETENESS_CHECKLIST.md"
  "$base_dir/templates/CANONICAL_GATE_CHECKLIST.md"
  "$base_dir/tools/note.sh"
  "$base_dir/tools/refresh_kb_all.sh"
  "$base_dir/tools/refresh_kb_group.sh"
  "$base_dir/tools/kb_search.sh"
  "$base_dir/tools/check_completeness.sh"
  "$base_dir/playbooks/CODEX_RULES.md"
  "$base_dir/playbooks/PM_AGENTS.md"
  "$base_dir/TASKS.md"
  "$base_dir/Makefile"
  "$base_dir/README.md"
)

missing=0
for p in "${required_paths[@]}"; do
  if [ ! -e "$p" ]; then
    echo "Missing: $p" >&2
    missing=1
  fi
  if [ -f "$p" ] && [ ! -s "$p" ]; then
    echo "Empty: $p" >&2
    missing=1
  fi
done

if [ "$missing" -ne 0 ]; then
  exit 1
fi

printf "Completeness OK\n"
