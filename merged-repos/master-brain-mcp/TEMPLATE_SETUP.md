# TEMPLATE SETUP

> 5-Minuten Setup für ein neues Projekt.

## Schritt 1: Repo erstellen

1. "Use this template" auf GitHub klicken
2. Neuen Repo-Namen eingeben
3. Private/Public wählen
4. "Create repository"

## Schritt 2: Lokales Setup

```bash
# Klonen
git clone https://github.com/[org]/[repo-name].git
cd [repo-name]

# Branch erstellen
git checkout -b setup/initial
```

## Schritt 3: Projekt-Infos ausfüllen

### 3.1 PROJECT_STATE.md
- [ ] Projekt-Ziel definieren
- [ ] MVP Features listen
- [ ] Tech-Stack Entscheidungen treffen

### 3.2 docs/PROJECT_BRIEF.md
- [ ] Projektname
- [ ] Owner
- [ ] Beschreibung
- [ ] Tech Stack

### 3.3 CONTRACTS/api_contract.md
- [ ] Basis-Endpoints definieren
- [ ] Auth-Endpoint (falls nötig)

### 3.4 CONTRACTS/data_contract.md
- [ ] Basis-Tabellen definieren
- [ ] Indizes planen

### 3.5 capabilities.yml
- [ ] Alle geplanten Features eintragen
- [ ] Test-Anforderungen festlegen

## Schritt 4: Platzhalter ersetzen

Suche und ersetze in allen Dateien:
- `[Projektname]` → Echter Projektname
- `[Name]` → Dein Name
- `YYYY-MM-DD` → Heutiges Datum
- `your-app.com` → Echte Domain

## Schritt 5: Commit & Push

```bash
git add .
git commit -m "chore: initialize project from template"
git push -u origin setup/initial
```

## Schritt 6: MASTER_RUNBOOK starten

Öffne `MASTER_RUNBOOK.md` und beginne mit **Step 0**.

---

## Konventionen

### Datei-Änderungen
- API/DB Contracts nur ändern mit: `ÄNDERUNG ERLAUBT: ...`
- Decisions dokumentieren in: `ops/DECISIONS.md`

### AI-Coding
- 1 Step pro Antwort
- Bei Unsicherheit: STOPP & FRAGEN
- Keine stillen Änderungen

### Git
- Branches: `feature/`, `fix/`, `chore/`
- Commits: `type: beschreibung`

---

## Hilfe

- Fragen: `ops/OPEN_QUESTIONS.md`
- Risiken: `ops/RISKS.md`
- Entscheidungen: `ops/DECISIONS.md`
