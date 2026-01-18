#!/usr/bin/env python3
"""check_manifest.py - Enforces PROJECT_MANIFEST.json presence and basic shape.

FAIL if:
- PROJECT_MANIFEST.json missing
- manifest_version missing or not int
- deploy_target missing or invalid

This is intentionally minimal; details may evolve without breaking the gate.
"""

import json
import os
import sys
from pathlib import Path

ALLOWED_DEPLOY_TARGETS = {"kubernetes", "vm_compose", "serverless"}


def main() -> int:
    repo_root = Path(os.environ.get("GITHUB_WORKSPACE", ".")).resolve()
    path = repo_root / "PROJECT_MANIFEST.json"

    if not path.exists():
        print("❌ FAIL: PROJECT_MANIFEST.json missing in repo root")
        return 1

    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception as e:
        print(f"❌ FAIL: PROJECT_MANIFEST.json not valid JSON: {e}")
        return 1

    mv = data.get("manifest_version")
    if not isinstance(mv, int):
        print("❌ FAIL: manifest_version must be an integer")
        return 1

    dt = data.get("deploy_target")
    if dt not in ALLOWED_DEPLOY_TARGETS:
        print(f"❌ FAIL: deploy_target must be one of {sorted(ALLOWED_DEPLOY_TARGETS)}")
        return 1

    envs = data.get("environments", {})
    if not isinstance(envs, dict) or "stage" not in envs or "prod" not in envs:
        print("❌ FAIL: environments must contain stage and prod")
        return 1

    print("✅ Manifest check: PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
