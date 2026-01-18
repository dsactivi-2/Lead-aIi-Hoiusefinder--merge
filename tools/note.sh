#!/usr/bin/env bash
set -euo pipefail

msg="${MSG:-${1:-}}"
if [ -z "$msg" ]; then
  echo "Usage: note.sh MSG=\"text\"" >&2
  exit 1
fi

base_dir="$(cd "$(dirname "$0")/.." && pwd)"
log_file="$base_dir/memory/MEETING_LOG.md"

stamp="$(date "+%Y-%m-%d %H:%M:%S")"
printf "[%s] %s\n" "$stamp" "$msg" >> "$log_file"
