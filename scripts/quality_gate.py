#!/usr/bin/env python3
"""
Quality Gate for KB Documents
- Checks YAML frontmatter in kb/**/*.md
- Scans for secrets in staged files
- Logs conflicts/mixed vendors to ops/OPEN_QUESTIONS.md
"""

import os
import re
import sys
import subprocess
from datetime import datetime
from pathlib import Path

# =============================================================================
# CONFIG
# =============================================================================

REQUIRED_FRONTMATTER_KEYS = ["vendor", "topic", "doc_type", "last_verified", "source_url", "tags"]

SECRET_PATTERNS = [
    r"OPENAI_API_KEY\s*=",
    r"ANTHROPIC_API_KEY\s*=",
    r"API_KEY\s*=",
    r"sk-[a-zA-Z0-9]{20,}",
    r"ghp_[a-zA-Z0-9]{36,}",
    r"gho_[a-zA-Z0-9]{36,}",
    r"glpat-[a-zA-Z0-9]{20,}",
    r"-----BEGIN [A-Z]+ PRIVATE KEY-----",
    r"password\s*[:=]",
    r"secret\s*[:=]",
]

RUN_REPORT_SCHEMA_PATH = Path("schemas/RUN_REPORT_SCHEMA.json")
RUN_REPORT_REQUIRED_FIELDS = [
    "run_id", "agent", "timestamp", "summary", "decisions",
    "open_questions", "risks", "changes", "next_actions", "refs", "redactions_done"
]

VENDOR_NAMES = ["openai", "anthropic", "sipgate"]

CONFLICT_MARKERS = ["CONFLICT:", "TODO: verify", "NEEDS_VERIFICATION"]

TEXT_EXTENSIONS = [".md", ".yml", ".yaml", ".json", ".py", ".txt", ".js", ".ts"]

OPEN_QUESTIONS_PATH = Path("ops/OPEN_QUESTIONS.md")

# =============================================================================
# HELPERS
# =============================================================================

def get_staged_files():
    """Get list of staged files."""
    result = subprocess.run(
        ["git", "diff", "--cached", "--name-only", "--diff-filter=ACM"],
        capture_output=True, text=True
    )
    return [f.strip() for f in result.stdout.strip().split("\n") if f.strip()]


def read_file_content(filepath):
    """Read file content, return None if binary or error."""
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            return f.read()
    except (UnicodeDecodeError, IOError):
        return None


def extract_frontmatter(content):
    """Extract YAML frontmatter from markdown content."""
    if not content.startswith("---"):
        return None

    parts = content.split("---", 2)
    if len(parts) < 3:
        return None

    frontmatter_text = parts[1].strip()

    # Simple key extraction (no yaml lib dependency)
    keys = set()
    for line in frontmatter_text.split("\n"):
        if ":" in line:
            key = line.split(":")[0].strip()
            if key and not key.startswith("#"):
                keys.add(key)

    return keys


def ensure_open_questions_file():
    """Ensure ops/OPEN_QUESTIONS.md exists."""
    OPEN_QUESTIONS_PATH.parent.mkdir(parents=True, exist_ok=True)
    if not OPEN_QUESTIONS_PATH.exists():
        with open(OPEN_QUESTIONS_PATH, "w") as f:
            f.write("# OPEN QUESTIONS\n\n")
            f.write("This file tracks conflicts, verification needs, and open items.\n\n")
            f.write("---\n\n")


def log_open_question(filepath, issue_type, details):
    """Log an entry to ops/OPEN_QUESTIONS.md."""
    ensure_open_questions_file()

    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
    entry = f"""
## [{timestamp}] {issue_type}

- **File:** `{filepath}`
- **Issue:** {details}
- **Action:** Review and resolve

---
"""
    with open(OPEN_QUESTIONS_PATH, "a") as f:
        f.write(entry)


# =============================================================================
# CHECKS
# =============================================================================

def check_frontmatter(staged_files):
    """Check KB markdown files have required frontmatter."""
    errors = []

    for filepath in staged_files:
        if not filepath.startswith("kb/") or not filepath.endswith(".md"):
            continue

        content = read_file_content(filepath)
        if content is None:
            continue

        keys = extract_frontmatter(content)

        if keys is None:
            errors.append(f"  {filepath}: Missing YAML frontmatter (must start with ---)")
            continue

        missing = [k for k in REQUIRED_FRONTMATTER_KEYS if k not in keys]
        if missing:
            errors.append(f"  {filepath}: Missing frontmatter keys: {', '.join(missing)}")

    return errors


def check_secrets(staged_files):
    """Scan for secrets in staged text files."""
    errors = []

    for filepath in staged_files:
        ext = Path(filepath).suffix
        if ext not in TEXT_EXTENSIONS:
            continue

        content = read_file_content(filepath)
        if content is None:
            continue

        for pattern in SECRET_PATTERNS:
            if re.search(pattern, content):
                errors.append(f"  {filepath}: Potential secret detected (pattern: {pattern[:30]}...)")
                break  # One error per file is enough

    return errors


def check_run_reports(staged_files):
    """Validate run report JSON files against schema."""
    errors = []

    for filepath in staged_files:
        if not filepath.startswith("runs/") or not filepath.endswith(".json"):
            continue

        content = read_file_content(filepath)
        if content is None:
            continue

        try:
            import json
            data = json.loads(content)
        except json.JSONDecodeError as e:
            errors.append(f"  {filepath}: Invalid JSON - {e}")
            continue

        # Check required fields
        missing = [k for k in RUN_REPORT_REQUIRED_FIELDS if k not in data]
        if missing:
            errors.append(f"  {filepath}: Missing required fields: {', '.join(missing)}")
            continue

        # Check redactions_done is true
        if not data.get("redactions_done", False):
            errors.append(f"  {filepath}: redactions_done must be true")

    return errors


def check_vendor_mixing(staged_files):
    """Check for vendor mixing and conflict markers, log warnings."""
    warnings = []

    for filepath in staged_files:
        # Only check vendor docs
        if not filepath.startswith("kb/vendors/"):
            continue

        # Determine which vendor folder this file is in
        parts = filepath.split("/")
        if len(parts) < 3:
            continue

        current_vendor = parts[2]  # kb/vendors/<vendor>/...

        content = read_file_content(filepath)
        if content is None:
            continue

        content_lower = content.lower()

        # Check for other vendors mentioned
        other_vendors = [v for v in VENDOR_NAMES if v != current_vendor and v in content_lower]
        if other_vendors:
            issue = f"Mentions other vendor(s): {', '.join(other_vendors)}"
            warnings.append(f"  {filepath}: {issue}")
            log_open_question(filepath, "Vendor Mixing", issue)

        # Check for conflict markers
        for marker in CONFLICT_MARKERS:
            if marker.lower() in content_lower:
                issue = f"Contains conflict marker: {marker}"
                warnings.append(f"  {filepath}: {issue}")
                log_open_question(filepath, "Conflict Marker", issue)
                break

    return warnings


# =============================================================================
# MAIN
# =============================================================================

def main():
    print("=" * 60)
    print("Quality Gate Check")
    print("=" * 60)

    staged_files = get_staged_files()

    if not staged_files:
        print("No staged files to check.")
        return 0

    print(f"\nChecking {len(staged_files)} staged file(s)...\n")

    exit_code = 0

    # A) Frontmatter check (BLOCKING)
    print("[A] KB Frontmatter Check...")
    fm_errors = check_frontmatter(staged_files)
    if fm_errors:
        print("  FAILED - Missing frontmatter:")
        for e in fm_errors:
            print(e)
        exit_code = 1
    else:
        print("  PASSED")

    # B) Secrets scan (BLOCKING)
    print("\n[B] Secrets Scan...")
    secret_errors = check_secrets(staged_files)
    if secret_errors:
        print("  FAILED - Potential secrets detected:")
        for e in secret_errors:
            print(e)
        exit_code = 1
    else:
        print("  PASSED")

    # C) Run Report Validation (BLOCKING)
    print("\n[C] Run Report Validation...")
    run_errors = check_run_reports(staged_files)
    if run_errors:
        print("  FAILED - Invalid run reports:")
        for e in run_errors:
            print(e)
        exit_code = 1
    else:
        print("  PASSED")

    # D) Vendor mixing / conflict markers (WARNING only)
    print("\n[D] Vendor Mixing / Conflict Markers...")
    mix_warnings = check_vendor_mixing(staged_files)
    if mix_warnings:
        print("  WARNINGS logged to ops/OPEN_QUESTIONS.md:")
        for w in mix_warnings:
            print(w)
    else:
        print("  PASSED (no issues)")

    print("\n" + "=" * 60)
    if exit_code == 0:
        print("Quality Gate: PASSED")
    else:
        print("Quality Gate: FAILED - Commit blocked")
    print("=" * 60)

    return exit_code


if __name__ == "__main__":
    sys.exit(main())
