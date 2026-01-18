#!/usr/bin/env bash
set -euo pipefail

if [ $# -ne 1 ]; then
  echo "Usage: refresh_kb_group.sh <group>" >&2
  exit 1
fi

group="$1"
base_dir="$(cd "$(dirname "$0")/.." && pwd)"
src_file="$base_dir/kb/sources/${group}.urls"
group_dir="$base_dir/kb/groups/$group"

if [ ! -f "$src_file" ]; then
  echo "Missing source file: $src_file" >&2
  exit 1
fi

mkdir -p "$group_dir"

while IFS= read -r line || [ -n "$line" ]; do
  line="$(printf "%s" "$line" | sed 's/[[:space:]]*$//')"
  case "$line" in
    ''|'#'*)
      continue
      ;;
  esac
  safe_name="$(printf "%s" "$line" | sed 's#https\?://##; s#[^A-Za-z0-9._-]#_#g')"
  out_file="$group_dir/${safe_name}.html"
  curl -fL "$line" -o "$out_file"
done < "$src_file"
