#!/usr/bin/env python3
"""
check_capabilities.py - Validiert capabilities.yml und Test-Anforderungen.

FAIL wenn:
- capabilities.yml fehlt
- YAML ungültig
- side_effect=true aber readback_tests leer/fehlt oder keine readback: Tags
- mode=BOTH aber tests enthalten nicht mind. ein http: UND ein mcp:
- mode=HTTP aber kein http: Test
- mode=MCP aber kein mcp: Test

Exit codes:
- 0: PASS
- 1: FAIL
"""

import os
import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    print("ERROR: PyYAML nicht installiert. Installiere mit: pip install pyyaml")
    sys.exit(1)


def load_capabilities(repo_root: Path) -> dict | None:
    """Lädt capabilities.yml."""
    cap_path = repo_root / "capabilities.yml"

    if not cap_path.exists():
        return None

    try:
        with open(cap_path) as f:
            return yaml.safe_load(f)
    except yaml.YAMLError as e:
        print(f"❌ FAIL: YAML Parse Error: {e}")
        return None


def has_test_prefix(tests: list, prefix: str) -> bool:
    """Prüft ob mindestens ein Test mit dem Prefix beginnt."""
    if not tests:
        return False
    return any(str(t).startswith(f"{prefix}:") for t in tests)


def check_capability(cap: dict) -> list[str]:
    """Prüft eine einzelne Capability."""
    errors = []
    name = cap.get("name", "UNKNOWN")
    mode = cap.get("mode", "N/A")
    side_effect = cap.get("side_effect", False)
    tests = cap.get("tests", [])
    readback_tests = cap.get("readback_tests", [])
    criticality = cap.get("criticality", "LOW")
    consumer = cap.get("consumer", [])

    # Skip N/A mode (non-runtime capabilities)
    if mode == "N/A":
        return errors

    # Mode-basierte Test-Anforderungen
    if mode == "HTTP":
        if not has_test_prefix(tests, "http"):
            errors.append(f"FAIL [{name}]: mode=HTTP aber kein 'http:' Test")

    elif mode == "MCP":
        if not has_test_prefix(tests, "mcp"):
            errors.append(f"FAIL [{name}]: mode=MCP aber kein 'mcp:' Test")

    elif mode == "BOTH":
        if not has_test_prefix(tests, "http"):
            errors.append(f"FAIL [{name}]: mode=BOTH aber kein 'http:' Test")
        if not has_test_prefix(tests, "mcp"):
            errors.append(f"FAIL [{name}]: mode=BOTH aber kein 'mcp:' Test")

    # Side Effect Anforderungen
    if side_effect:
        has_readback = has_test_prefix(tests, "readback") or has_test_prefix(readback_tests, "readback")
        if not has_readback:
            errors.append(f"FAIL [{name}]: side_effect=true aber kein 'readback:' Test")

    # Criticality Anforderungen
    high_criticality = ["MONEY", "COMPLIANCE", "SECURITY", "BRAIN", "CRITICAL", "HIGH"]
    if criticality in high_criticality:
        if not has_test_prefix(tests, "integration"):
            errors.append(f"FAIL [{name}]: criticality={criticality} aber kein 'integration:' Test")

    # Consumer UI Anforderungen
    if "UI" in consumer:
        if not has_test_prefix(tests, "e2e"):
            errors.append(f"FAIL [{name}]: consumer includes UI aber kein 'e2e:' Test")

    return errors


def main():
    repo_root = Path(os.environ.get("GITHUB_WORKSPACE", ".")).resolve()

    print(f"Prüfe capabilities.yml in: {repo_root}")
    print("=" * 60)

    # Lade Capabilities
    data = load_capabilities(repo_root)

    if data is None:
        cap_path = repo_root / "capabilities.yml"
        if not cap_path.exists():
            print("❌ FAIL: capabilities.yml nicht gefunden")
        return 1

    capabilities = data.get("capabilities", [])

    if not capabilities:
        print("⚠️  WARN: Keine Capabilities definiert")
        print("✅ Capabilities Check: PASS (leer)")
        return 0

    print(f"Gefunden: {len(capabilities)} Capabilities")

    all_errors = []

    for cap in capabilities:
        errors = check_capability(cap)
        all_errors.extend(errors)

    # Output
    for error in all_errors:
        print(f"❌ {error}")

    if not all_errors:
        print("✅ Capabilities Check: PASS")
        return 0
    else:
        print(f"\n❌ Capabilities Check: FAIL ({len(all_errors)} Fehler)")
        return 1


if __name__ == "__main__":
    sys.exit(main())
