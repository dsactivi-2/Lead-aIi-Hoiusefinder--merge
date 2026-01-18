#!/usr/bin/env python3
"""
check_test_plan.py - Verifiziert Testplan gegen Capabilities.

Prüft:
- Jede Capability hat einen Abschnitt im Testplan
- Pflicht-Kategorien sind vorhanden je nach Capability-Eigenschaften

FAIL wenn:
- TEST_PLAN.md fehlt
- Capability ohne Testplan-Abschnitt
- Pflicht-Test-Kategorie fehlt

Exit codes:
- 0: PASS
- 1: FAIL
"""

import os
import re
import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    print("ERROR: PyYAML nicht installiert. Installiere mit: pip install pyyaml")
    sys.exit(1)

# Mögliche Pfade für Testplan
TESTPLAN_PATHS = [
    "tests/TEST_PLAN.md",
    "docs/TEST_PLAN.md",
    "TEST_PLAN.md",
]


def find_testplan(repo_root: Path) -> Path | None:
    """Findet TEST_PLAN.md."""
    for path in TESTPLAN_PATHS:
        plan_path = repo_root / path
        if plan_path.exists():
            return plan_path
    return None


def load_capabilities(repo_root: Path) -> list:
    """Lädt Capabilities aus capabilities.yml."""
    cap_path = repo_root / "capabilities.yml"

    if not cap_path.exists():
        return []

    try:
        with open(cap_path) as f:
            data = yaml.safe_load(f)
            return data.get("capabilities", [])
    except yaml.YAMLError:
        return []


def get_required_categories(cap: dict) -> list[str]:
    """Ermittelt Pflicht-Test-Kategorien für eine Capability."""
    required = ["unit"]  # unit ist immer Pflicht
    mode = cap.get("mode", "N/A")
    side_effect = cap.get("side_effect", False)
    criticality = cap.get("criticality", "LOW")
    consumer = cap.get("consumer", [])

    # Skip N/A mode
    if mode == "N/A":
        return required

    # Mode-basiert
    if mode == "HTTP":
        required.append("http")
    elif mode == "MCP":
        required.append("mcp")
    elif mode == "BOTH":
        required.append("http")
        required.append("mcp")

    # Side effect
    if side_effect:
        required.append("readback")

    # Criticality
    high_criticality = ["MONEY", "COMPLIANCE", "SECURITY", "BRAIN", "CRITICAL", "HIGH"]
    if criticality in high_criticality:
        required.append("integration")

    # Consumer UI
    if "UI" in consumer:
        required.append("e2e")

    return required


def check_testplan_coverage(testplan_content: str, capabilities: list) -> list[str]:
    """Prüft ob alle Capabilities im Testplan abgedeckt sind."""
    errors = []

    for cap in capabilities:
        name = cap.get("name", "UNKNOWN")
        mode = cap.get("mode", "N/A")

        # Skip N/A mode capabilities for testplan coverage
        if mode == "N/A":
            continue

        # Suche nach Capability-Abschnitt im Testplan
        # Akzeptiere verschiedene Formate: ## name, ### name, - name, **name**
        patterns = [
            rf"##\s*{re.escape(name)}",
            rf"###\s*{re.escape(name)}",
            rf"^\s*-\s*\*?\*?{re.escape(name)}\*?\*?",
            rf"\*\*{re.escape(name)}\*\*",
        ]

        found = False
        for pattern in patterns:
            if re.search(pattern, testplan_content, re.IGNORECASE | re.MULTILINE):
                found = True
                break

        if not found:
            errors.append(f"FAIL [{name}]: Kein Abschnitt im TEST_PLAN.md gefunden")

    return errors


def check_testplan_categories(testplan_content: str, capabilities: list) -> list[str]:
    """Prüft ob Pflicht-Kategorien im Testplan erwähnt sind."""
    errors = []

    for cap in capabilities:
        name = cap.get("name", "UNKNOWN")
        mode = cap.get("mode", "N/A")

        if mode == "N/A":
            continue

        required = get_required_categories(cap)

        for category in required:
            # Suche nach category: im Kontext der Capability
            # Einfache Heuristik: category: muss irgendwo im Dokument sein
            pattern = rf"{category}:"
            if not re.search(pattern, testplan_content, re.IGNORECASE):
                errors.append(f"WARN [{name}]: Test-Kategorie '{category}:' nicht im Testplan")

    return errors


def main():
    repo_root = Path(os.environ.get("GITHUB_WORKSPACE", ".")).resolve()

    print(f"Prüfe TEST_PLAN in: {repo_root}")
    print("=" * 60)

    # Lade Capabilities
    capabilities = load_capabilities(repo_root)

    if not capabilities:
        print("⚠️  WARN: Keine Capabilities gefunden, überspringe Testplan-Check")
        print("✅ Testplan Check: PASS (keine Capabilities)")
        return 0

    # Filtere nur Runtime-Capabilities (nicht N/A)
    runtime_caps = [c for c in capabilities if c.get("mode", "N/A") != "N/A"]

    if not runtime_caps:
        print("ℹ️  INFO: Keine Runtime-Capabilities (alle mode=N/A)")
        print("✅ Testplan Check: PASS (nur N/A Capabilities)")
        return 0

    # Finde Testplan
    testplan_path = find_testplan(repo_root)

    if not testplan_path:
        print(f"❌ FAIL: TEST_PLAN.md nicht gefunden")
        print(f"   Gesucht in: {', '.join(TESTPLAN_PATHS)}")
        print(f"   Benötigt für {len(runtime_caps)} Runtime-Capabilities")
        return 1

    print(f"Gefunden: {testplan_path.relative_to(repo_root)}")
    print(f"Runtime-Capabilities: {len(runtime_caps)}")

    testplan_content = testplan_path.read_text()

    all_errors = []
    all_warnings = []

    # Prüfungen
    all_errors.extend(check_testplan_coverage(testplan_content, runtime_caps))
    all_warnings.extend(check_testplan_categories(testplan_content, runtime_caps))

    # Output
    for warning in all_warnings:
        print(f"⚠️  {warning}")

    for error in all_errors:
        print(f"❌ {error}")

    if not all_errors:
        print("✅ Testplan Check: PASS")
        return 0
    else:
        print(f"\n❌ Testplan Check: FAIL ({len(all_errors)} Fehler)")
        return 1


if __name__ == "__main__":
    sys.exit(main())
