#!/usr/bin/env python3
"""
check_project_brief.py - Prüft PROJECT_BRIEF.md auf Vollständigkeit.

FAIL wenn:
- PROJECT_BRIEF.md fehlt
- PROJECT_BRIEF.md ist leer
- PROJECT_BRIEF.md enthält TODO-Marker
- Pflichtfelder fehlen oder sind leer

Exit codes:
- 0: PASS
- 1: FAIL
"""

import os
import re
import sys
from pathlib import Path

# Mögliche Pfade für PROJECT_BRIEF
BRIEF_PATHS = [
    "docs/PROJECT_BRIEF.md",
    "PROJECT_BRIEF.md",
]

# TODO-Marker die FAIL auslösen
TODO_MARKERS = [
    "TODO",
    "FIXME",
    "XXX",
    "<!-- PFLICHT:",
    "<!-- weitere -->",
]

# Pflicht-Abschnitte (Regex für Markdown Headers)
REQUIRED_SECTIONS = [
    r"##\s*\d*\.?\s*Projekt-Übersicht",
    r"##\s*\d*\.?\s*Zweck",
]

# Pflichtfelder in der Übersicht
REQUIRED_FIELDS = [
    "Name",
    "Owner",
    "Status",
]


def find_brief(repo_root: Path) -> Path | None:
    """Findet PROJECT_BRIEF.md."""
    for path in BRIEF_PATHS:
        brief_path = repo_root / path
        if brief_path.exists():
            return brief_path
    return None


def check_not_empty(brief_path: Path) -> list[str]:
    """Prüft ob Datei nicht leer ist."""
    errors = []
    content = brief_path.read_text().strip()

    if not content:
        errors.append("FAIL: PROJECT_BRIEF.md ist leer")
    elif len(content) < 100:
        errors.append("FAIL: PROJECT_BRIEF.md ist zu kurz (< 100 Zeichen)")

    return errors


def check_no_todos(brief_path: Path) -> list[str]:
    """Prüft ob keine TODO-Marker vorhanden sind."""
    errors = []
    content = brief_path.read_text()

    for marker in TODO_MARKERS:
        if marker in content:
            # Finde Zeilennummer
            lines = content.splitlines()
            for i, line in enumerate(lines, 1):
                if marker in line:
                    errors.append(f"FAIL: TODO-Marker '{marker}' in Zeile {i}")
                    break

    return errors


def check_required_sections(brief_path: Path) -> list[str]:
    """Prüft ob Pflichtabschnitte vorhanden sind."""
    errors = []
    content = brief_path.read_text()

    for pattern in REQUIRED_SECTIONS:
        if not re.search(pattern, content, re.IGNORECASE):
            errors.append(f"FAIL: Pflichtabschnitt fehlt (Pattern: {pattern})")

    return errors


def check_required_fields(brief_path: Path) -> list[str]:
    """Prüft ob Pflichtfelder ausgefüllt sind."""
    errors = []
    content = brief_path.read_text()

    for field in REQUIRED_FIELDS:
        # Suche nach "| **Field** | Value |" Pattern
        pattern = rf"\|\s*\*?\*?{field}\*?\*?\s*\|\s*([^|]+)\s*\|"
        match = re.search(pattern, content, re.IGNORECASE)

        if not match:
            errors.append(f"FAIL: Pflichtfeld '{field}' nicht gefunden")
        else:
            value = match.group(1).strip()
            if not value or value.startswith("<!--") or value == "-":
                errors.append(f"FAIL: Pflichtfeld '{field}' ist leer oder Platzhalter")

    return errors


def main():
    repo_root = Path(os.environ.get("GITHUB_WORKSPACE", ".")).resolve()

    print(f"Prüfe PROJECT_BRIEF in: {repo_root}")
    print("=" * 60)

    # Finde Brief
    brief_path = find_brief(repo_root)

    if not brief_path:
        print(f"❌ FAIL: PROJECT_BRIEF.md nicht gefunden")
        print(f"   Gesucht in: {', '.join(BRIEF_PATHS)}")
        return 1

    print(f"Gefunden: {brief_path.relative_to(repo_root)}")

    all_errors = []

    # Prüfungen
    all_errors.extend(check_not_empty(brief_path))

    if not all_errors:  # Nur wenn nicht leer
        all_errors.extend(check_no_todos(brief_path))
        all_errors.extend(check_required_sections(brief_path))
        all_errors.extend(check_required_fields(brief_path))

    # Output
    for error in all_errors:
        print(f"❌ {error}")

    if not all_errors:
        print("✅ PROJECT_BRIEF Check: PASS")
        return 0
    else:
        print(f"\n❌ PROJECT_BRIEF Check: FAIL ({len(all_errors)} Fehler)")
        return 1


if __name__ == "__main__":
    sys.exit(main())
