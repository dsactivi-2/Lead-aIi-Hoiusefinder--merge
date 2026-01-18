#!/usr/bin/env bash
set -euo pipefail

base_dir="$(cd "$(dirname "$0")/.." && pwd)"
sources_dir="$base_dir/kb/sources"
groups_dir="$base_dir/kb/groups"

shopt -s nullglob
files=("$sources_dir"/*.urls)
if [ ${#files[@]} -eq 0 ]; then
  echo "No source files in $sources_dir" >&2
  exit 1
fi

for src in "${files[@]}"; do
  group="$(basename "$src" .urls)"
  "$base_dir/tools/refresh_kb_group.sh" "$group"
done
