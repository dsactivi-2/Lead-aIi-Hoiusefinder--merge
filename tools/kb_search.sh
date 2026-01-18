#!/usr/bin/env bash
set -euo pipefail

q="${Q:-${1:-}}"
if [ -z "$q" ]; then
  echo "Usage: kb_search.sh Q=term" >&2
  exit 1
fi

base_dir="$(cd "$(dirname "$0")/.." && pwd)"
grep -R -n -- "$q" "$base_dir/kb/groups" | head -n 50
