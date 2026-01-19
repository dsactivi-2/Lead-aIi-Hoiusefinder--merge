# Codex CLI Regeln für dieses Projekt

---

## PFLICHT BEI SESSION-START

**STOPP! Bevor du IRGENDETWAS tust, lies diese Dateien:**

```bash
cat ops/POLICY.md
cat MASTER_RUNBOOK.md
cat capabilities.yml
cat PRODUCTION_CHECKLIST.md
cat CONTRACTS/api_contract.md
cat CONTRACTS/data_contract.md
```

**Erst nach dem Lesen darfst du arbeiten!**

---

## Warum?

| Datei | Enthält |
|-------|---------|
| `ops/POLICY.md` | Merge-Regeln, Branch-Namen, Push-Rules, Versioning |
| `MASTER_RUNBOOK.md` | Step 0-10 Workflow, STOPP-Punkte |
| `capabilities.yml` | Test-Pflichten pro Feature |
| `PRODUCTION_CHECKLIST.md` | Alle Go-Live Checks |
| `CONTRACTS/*.md` | API + DB Definitionen |

---

## Kurzregeln

### Contracts-First
- API/DB Änderung → ZUERST Contract aktualisieren → DANN Code

### Branch-Namen
- Features: `feature/beschreibung`
- Fixes: `fix/beschreibung`
- Hotfixes: `hotfix/beschreibung`

### Merge-Strategie
- feature → develop: **Squash**
- develop → main: **Merge Commit**

### Tests
- Jede Funktion → in `capabilities.yml` registrieren
- Keine Funktion ohne Test

### STOPP-Punkte
- Nach Step 7 → `docs/CONTRACT_VERIFICATION.md` prüfen
- Nach Step 8 → `PRODUCTION_CHECKLIST.md` prüfen

---

## Verbotene Aktionen

❌ Pflicht-Dateien löschen
❌ Contracts still ändern
❌ Code ohne Tests
❌ Production ohne Checklist
❌ Merge ohne Review
❌ Force Push zu main/develop
