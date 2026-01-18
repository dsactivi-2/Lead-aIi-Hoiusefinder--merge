# TEST_PLAN: Master_Brain

> Testplan für alle Capabilities dieses Repositories.

## Übersicht

| Capability | Mode | Tests | Status |
|------------|------|-------|--------|
| policy_enforcement | N/A | unit, integration | Defined |
| template_provision | N/A | unit | Defined |

---

## Capabilities

### policy_enforcement

**Beschreibung:** Enforces organizational policies via CI checks

**Mode:** N/A (kein Runtime-Service)

**Required Tests:**
- `unit:` Tests

**Test-Definitionen:**

| Test ID | Kategorie | Beschreibung | Command |
|---------|-----------|--------------|---------|
| unit:check_structure | unit | Prüft check_structure.py Logik | `python -m pytest tests/test_check_structure.py` |
| unit:check_project_brief | unit | Prüft check_project_brief.py Logik | `python -m pytest tests/test_check_project_brief.py` |
| unit:check_capabilities | unit | Prüft check_capabilities.py Logik | `python -m pytest tests/test_check_capabilities.py` |
| integration:full_ci_pipeline | integration | Prüft gesamte CI Pipeline | GitHub Actions Workflow Run |

---

### template_provision

**Beschreibung:** Provides templates for new repositories

**Mode:** N/A (kein Runtime-Service)

**Required Tests:**
- `unit:` Tests

**Test-Definitionen:**

| Test ID | Kategorie | Beschreibung | Command |
|---------|-----------|--------------|---------|
| unit:template_valid_markdown | unit | Templates sind valides Markdown | `python scripts/ci/validate_markdown.py ops/templates/` |
| unit:template_no_todos | unit | Templates haben keine TODO-Marker | `grep -r "TODO" ops/templates/ && exit 1 || exit 0` |

---

## Test-Kategorien Referenz

| Präfix | Bedeutung | Wann Pflicht |
|--------|-----------|--------------|
| `unit:` | Unit Tests | Immer |
| `http:` | HTTP/REST API Tests | mode=HTTP oder mode=BOTH |
| `mcp:` | MCP Protocol Tests | mode=MCP oder mode=BOTH |
| `readback:` | Verification nach Side Effect | side_effect=true |
| `integration:` | Integration Tests | criticality in {HIGH, CRITICAL, MONEY, SECURITY, COMPLIANCE, BRAIN} |
| `e2e:` | End-to-End Journey Tests | consumer includes UI |

---

## Ausführung

### Alle Unit Tests

```bash
python -m pytest tests/ -v
```

### Einzelne Checks

```bash
# Struktur
python scripts/ci/check_structure.py

# Brief
python scripts/ci/check_project_brief.py

# Capabilities
python scripts/ci/check_capabilities.py

# Testplan
python scripts/ci/check_test_plan.py
```

### CI Pipeline (lokal simulieren)

```bash
# Alle Checks nacheinander
python scripts/ci/check_structure.py && \
python scripts/ci/check_project_brief.py && \
python scripts/ci/check_capabilities.py && \
python scripts/ci/check_test_plan.py && \
echo "✅ All checks passed"
```
