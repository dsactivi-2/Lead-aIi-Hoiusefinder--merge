# POLICY

> Verbindliche Regeln für dieses Projekt.

## Code-Regeln

### 1. Keine Secrets im Code
- Secrets gehören in ENV Variables
- .env Dateien NIEMALS committen
- .env.example enthält keine echten Werte

### 2. Evidence Required
- Keine Behauptung ohne Beweis
- "Gepusht" → Commit Hash zeigen
- "Deployed" → URL + Health Check
- "Funktioniert" → Test-Output

### 3. Contracts sind Gesetz
- API Endpoints nur aus `CONTRACTS/api_contract.md`
- DB Schema nur aus `CONTRACTS/data_contract.md`
- Änderungen nur mit: `ÄNDERUNG ERLAUBT: ...`

### 4. Tests für alles
- Keine Funktion ohne Test
- Keine PR ohne grüne Tests
- Test-IDs in UI-Elementen (data-testid)

## AI/Agent-Regeln

### 1. Single Source of Truth
- `PROJECT_STATE.md` ist die Wahrheit
- Bei Widersprüchen: PROJECT_STATE gewinnt

### 2. 1 Step pro Antwort
- Nicht mehrere Schritte auf einmal
- Nach jedem Step: Status-Update

### 3. Bei Unsicherheit: STOPP & FRAGEN
- Maximal 5-7 Fragen auf einmal
- Nicht raten

### 4. Keine stillen Änderungen
- Jede Änderung muss genannt werden
- Keine versteckten Side Effects

## Git-Regeln

### 1. Branch-Namen
```
feature/kurze-beschreibung    # Neue Features
fix/kurze-beschreibung        # Bugfixes
chore/kurze-beschreibung      # Maintenance
hotfix/kurze-beschreibung     # Kritische Production-Fixes
release/v1.2.3                # Release-Branches
```

### 2. Commit-Messages
```
type: kurze beschreibung

Types:
- feat:     Neues Feature
- fix:      Bugfix
- docs:     Dokumentation
- style:    Formatting (kein Code-Change)
- refactor: Code-Refactoring
- test:     Tests hinzufügen/ändern
- chore:    Maintenance

Beispiele:
- feat: add booking endpoint
- fix: handle null in user lookup
- docs: update API contract
```

### 3. Vor Push Checklist
- [ ] Tests grün? (`npm test`)
- [ ] Keine Secrets? (`grep -r "sk-\|password=" src/`)
- [ ] .env nicht dabei? (`git status`)
- [ ] Lint grün? (`npm run lint`)

---

## Branch Protection (GitHub Settings)

### Main Branch
```
✅ Require pull request before merging
✅ Require approvals: 1 (oder mehr)
✅ Dismiss stale reviews when new commits are pushed
✅ Require status checks to pass (CI Gate)
✅ Require branches to be up to date before merging
❌ Allow force pushes: NIEMALS
❌ Allow deletions: NIEMALS
```

### Staging Branch
```
✅ Require pull request before merging
✅ Require approvals: 1
✅ Require status checks to pass (CI Gate)
❌ Allow force pushes: NIEMALS
❌ Allow deletions: NIEMALS
```

### Agent Branches (agent/*)
```
✅ Direct push erlaubt (für den jeweiligen Agent)
✅ Keine PR-Pflicht auf eigenen Branch
✅ Force push erlaubt (eigener Branch)
❌ Push auf fremde agent/* Branches: NEIN
```

---

## Merge-Regeln

### Merge Strategy
| Von | Nach | Strategie |
|-----|------|-----------|
| feature/* | staging | **Squash Merge** (saubere History) |
| fix/* | staging | **Squash Merge** |
| staging | main | **Merge Commit** (Traceability) |
| hotfix/* | main | **Merge Commit** |
| release/* | main | **Merge Commit** + Tag |

### Merge Voraussetzungen
- [ ] Mindestens 1 Approval
- [ ] Alle CI Checks grün
- [ ] Keine offenen Kommentare
- [ ] Branch ist up-to-date mit Target
- [ ] Keine Merge-Konflikte

### Nach Merge
- [ ] Branch löschen (außer main/staging)
- [ ] Issue/Ticket schließen
- [ ] Changelog aktualisieren (bei Release)

---

## Push-Regeln

### Erlaubt
| Aktion | main | staging | feature/* | agent/* |
|--------|------|---------|-----------|---------|
| Direct Push | ❌ | ❌ | ✅ | ✅ |
| Force Push | ❌ | ❌ | ✅ (eigener) | ✅ (eigener) |
| Delete | ❌ | ❌ | ✅ (nach Merge) | ✅ |

### Verboten
- ❌ Force Push auf main/staging
- ❌ Commits ohne PR auf main/staging
- ❌ Merge ohne Approval
- ❌ Push mit failing Tests

---

## Versioning (SemVer)

```
MAJOR.MINOR.PATCH

MAJOR: Breaking Changes (API nicht mehr kompatibel)
MINOR: Neue Features (rückwärtskompatibel)
PATCH: Bugfixes (rückwärtskompatibel)

Beispiele:
- 1.0.0 → 2.0.0: Breaking API Change
- 1.0.0 → 1.1.0: Neues Feature
- 1.0.0 → 1.0.1: Bugfix
```

---

## Review-Regeln

### PR Checklist
- [ ] Beschreibung ausgefüllt
- [ ] Tests vorhanden + grün
- [ ] Contracts eingehalten
- [ ] Keine Secrets
- [ ] Swagger aktualisiert (falls API-Änderung)
- [ ] Keine TODO-Kommentare ohne Issue

### Reviewer Pflichten
- [ ] Code verstanden
- [ ] Tests geprüft
- [ ] Security-Aspekte geprüft
- [ ] Contracts-Einhaltung geprüft
- [ ] Konstruktives Feedback gegeben
