# MANDATORY - Pflicht-Template für alle Projekte

> **Dieses Template ist PFLICHT für alle Projekte in der Organisation.**
> Keine Ausnahmen. Kein "machen wir später".

---

## Warum Pflicht?

| Grund | Ohne Template | Mit Template |
|-------|---------------|--------------|
| **Konsistenz** | Jedes Projekt anders | Einheitliche Struktur |
| **Onboarding** | Stunden/Tage | Minuten |
| **Code Review** | Unklar was zu prüfen | Klare Checklisten |
| **Production** | "Vergessen" | Pflicht-Checklist |
| **AI Agents** | Chaos | Klare Prompts + Contracts |

---

## Pflicht-Dateien (Minimum)

Diese Dateien MÜSSEN in jedem Projekt vorhanden sein:

| Datei | Zweck | Pflicht ab |
|-------|-------|------------|
| `README.md` | Projekt-Übersicht | Tag 1 |
| `PROJECT_STATE.md` | Single Source of Truth | Tag 1 |
| `MASTER_RUNBOOK.md` | Entwicklungs-Guide | Tag 1 |
| `PRODUCTION_CHECKLIST.md` | Go-Live Checks | Tag 1 |
| `capabilities.yml` | Features + Tests | Tag 1 |
| `CONTRACTS/api_contract.md` | API Definition | Vor Backend |
| `CONTRACTS/data_contract.md` | DB Schema | Vor Backend |
| `ops/POLICY.md` | Projekt-Regeln | Tag 1 |
| `.gitignore` | Git Excludes | Tag 1 |
| `.env.example` | ENV Dokumentation | Vor Backend |

---

## CI Enforcement

Die CI Pipeline prüft automatisch ob Pflicht-Dateien vorhanden sind:

```yaml
# .github/workflows/ci.yml prüft:
- README.md
- PROJECT_STATE.md
- MASTER_RUNBOOK.md
- PRODUCTION_CHECKLIST.md
- capabilities.yml
- CONTRACTS/api_contract.md
- CONTRACTS/data_contract.md
- ops/POLICY.md
- .gitignore
```

**PR wird blockiert wenn Dateien fehlen!**

---

## Neue Projekte erstellen

### Option 1: GitHub Template (empfohlen)

```bash
# 1. Auf GitHub "Use this template" klicken
# 2. Neuen Repo-Namen eingeben
# 3. TEMPLATE_SETUP.md befolgen
```

### Option 2: Git Clone

```bash
# Template klonen
git clone https://github.com/[org]/activi-project-template.git new-project
cd new-project

# Git History entfernen
rm -rf .git
git init

# Neues Repo erstellen
git add .
git commit -m "chore: initialize from template"
git remote add origin https://github.com/[org]/new-project.git
git push -u origin main
```

### Option 3: Degit (ohne Git History)

```bash
npx degit [org]/activi-project-template new-project
cd new-project
git init
```

---

## Ausnahmen

**Es gibt KEINE Ausnahmen.**

Wenn ein Projekt "zu klein" scheint:
- Trotzdem Template verwenden
- Nicht benötigte Dateien als "N/A" markieren
- Struktur beibehalten

---

## Compliance Check

Jedes Projekt wird geprüft auf:

| Check | Wie | Wann |
|-------|-----|------|
| Pflicht-Dateien | CI Pipeline | Bei jedem Push |
| Contracts vorhanden | CI Pipeline | Bei jedem Push |
| Production Checklist | Quality Gate | Vor Merge zu main |
| Keine Secrets | Secrets Scan | Bei jedem Push |

---

## Bei Verstößen

1. **CI blockiert** - PR kann nicht gemergt werden
2. **Review abgelehnt** - Reviewer verweist auf Template
3. **Eskalation** - Bei wiederholten Verstößen

---

## Support

Bei Fragen zum Template:
1. `ops/OPEN_QUESTIONS.md` im Projekt nutzen
2. Template-Repo Issues erstellen
3. Team-Lead fragen

---

## Changelog

Änderungen am Template werden im zentralen Template-Repo dokumentiert.
Projekte sollten regelmäßig prüfen ob Updates verfügbar sind.
