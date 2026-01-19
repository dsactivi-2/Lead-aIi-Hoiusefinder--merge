#!/usr/bin/env python3
"""check_mcp_test_registry.py - Enforces that each registered tool has mock+real tests.

Reads mcp_tests.yml.
FAIL if:
- file missing
- schema missing
- any tool lacks mock or real tests
"""

import os
import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    print("Missing dependency: pyyaml")
    sys.exit(1)


def main() -> int:
    repo_root = Path(os.environ.get("GITHUB_WORKSPACE", ".")).resolve()
    path = repo_root / "mcp_tests.yml"
    if not path.exists():
        print("❌ FAIL: mcp_tests.yml missing")
        return 1

    data = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    reg = data.get("registry", {})
    tools = reg.get("tools", [])
    if not isinstance(tools, list) or not tools:
        print("❌ FAIL: registry.tools must be a non-empty list")
        return 1

    failures = 0
    for t in tools:
        name = t.get("name")
        tests = (t.get("tests") or {})
        mock = tests.get("mock")
        real = tests.get("real")
        if not name:
            print("❌ FAIL: tool without name")
            failures += 1
            continue
        if not isinstance(mock, list) or len(mock) == 0:
            print(f"❌ FAIL: tool '{name}' missing mock tests")
            failures += 1
        if not isinstance(real, list) or len(real) == 0:
            print(f"❌ FAIL: tool '{name}' missing real tests")
            failures += 1

    if failures:
        print(f"\n❌ MCP test registry check: FAIL ({failures} problems)")
        return 1

    print("✅ MCP test registry check: PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
