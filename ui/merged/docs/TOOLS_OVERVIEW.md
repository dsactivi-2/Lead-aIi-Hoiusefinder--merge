# Tools Overview - Master_Brain

> Übersicht der CI-Enforcement Tools in diesem Repository.

## 1. CI Scripts

| Script | Zweck | Pfad |
|--------|-------|------|
| `check_structure.py` | Prüft Repo-Struktur auf Pflichtverzeichnisse/-dateien | `scripts/ci/` |
| `check_project_brief.py` | Prüft PROJECT_BRIEF.md auf Vollständigkeit | `scripts/ci/` |
| `check_capabilities.py` | Validiert capabilities.yml und Test-Anforderungen | `scripts/ci/` |
| `check_test_plan.py` | Verifiziert Testplan gegen Capabilities | `scripts/ci/` |

## 2. Workflows

| Workflow | Trigger | Jobs |
|----------|---------|------|
| `org_policy_enforce.yml` | PR to main/develop | structure, brief, capabilities, testplan |

## 3. Policies

| Policy | Beschreibung | Pfad |
|--------|--------------|------|
| `HTTP_MCP_ADDENDUM.md` | Regeln für HTTP/MCP Test-Anforderungen | `ops/policy/` |

## 4. Templates

| Template | Zweck | Pfad |
|----------|-------|------|
| `PROJECT_BRIEF_TEMPLATE.md` | Vorlage für PROJECT_BRIEF.md | `ops/templates/` |

## 5. Verwendung

### In anderen Repos

1. Kopiere relevante Scripts nach `.github/workflows/` oder `scripts/ci/`
2. Passe `capabilities.yml` an dein Repo an
3. Erstelle `docs/PROJECT_BRIEF.md` basierend auf Template
4. CI wird automatisch enforced bei PRs

### Lokale Prüfung

```bash
# Struktur prüfen
python scripts/ci/check_structure.py

# PROJECT_BRIEF prüfen
python scripts/ci/check_project_brief.py

# Capabilities prüfen
python scripts/ci/check_capabilities.py

# Testplan prüfen
python scripts/ci/check_test_plan.py
```
