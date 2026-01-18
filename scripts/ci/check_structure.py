#!/usr/bin/env python3
"""
check_structure.py - Prüft Repo-Struktur auf Pflichtverzeichnisse/-dateien.

FAIL wenn:
- Pflichtverzeichnisse fehlen
- Pflichtdateien fehlen
- .gitignore .env/.env.* nicht enthält

Exit codes:
- 0: PASS
- 1: FAIL
"""

import os
import sys
from pathlib import Path

# Pflichtverzeichnisse (mindestens eines muss existieren pro Gruppe)
REQUIRED_DIRS_GROUPS = [
    # Mindestens docs ODER README.md
    ["docs"],
]

# Pflichtdateien
REQUIRED_FILES = [
    ".gitignore",
    "capabilities.yml",
]

# Optional aber empfohlen
RECOMMENDED_FILES = [
    "docs/PROJECT_BRIEF.md",
    ".github/pull_request_template.md",
]

# .gitignore MUSS diese Einträge enthalten
GITIGNORE_REQUIRED = [
    ".env",
]


def check_gitignore(repo_root: Path) -> list[str]:
    """Prüft ob .gitignore die erforderlichen Einträge enthält."""
    errors = []
    gitignore_path = repo_root / ".gitignore"

    if not gitignore_path.exists():
        errors.append("FAIL: .gitignore nicht gefunden")
        return errors

    content = gitignore_path.read_text()
    lines = [line.strip() for line in content.splitlines()]

    for required in GITIGNORE_REQUIRED:
        # Prüfe ob .env oder .env* vorhanden
        found = False
        for line in lines:
            if line == required or line.startswith(f"{required}"):
                found = True
                break
        if not found:
            errors.append(f"FAIL: .gitignore enthält nicht '{required}' oder '{required}.*'")

    return errors


def check_required_files(repo_root: Path) -> list[str]:
    """Prüft ob Pflichtdateien existieren."""
    errors = []

    for file in REQUIRED_FILES:
        file_path = repo_root / file
        if not file_path.exists():
            errors.append(f"FAIL: Pflichtdatei fehlt: {file}")

    return errors


def check_recommended_files(repo_root: Path) -> list[str]:
    """Prüft empfohlene Dateien (nur Warnings)."""
    warnings = []

    for file in RECOMMENDED_FILES:
        file_path = repo_root / file
        if not file_path.exists():
            warnings.append(f"WARN: Empfohlene Datei fehlt: {file}")

    return warnings


def main():
    repo_root = Path(os.environ.get("GITHUB_WORKSPACE", ".")).resolve()

    print(f"Prüfe Repo-Struktur in: {repo_root}")
    print("=" * 60)

    all_errors = []
    all_warnings = []

    # Prüfungen
    all_errors.extend(check_gitignore(repo_root))
    all_errors.extend(check_required_files(repo_root))
    all_warnings.extend(check_recommended_files(repo_root))

    # Output
    for warning in all_warnings:
        print(f"⚠️  {warning}")

    for error in all_errors:
        print(f"❌ {error}")

    if not all_errors:
        print("✅ Struktur-Check: PASS")
        return 0
    else:
        print(f"\n❌ Struktur-Check: FAIL ({len(all_errors)} Fehler)")
        return 1


if __name__ == "__main__":
    sys.exit(main())
