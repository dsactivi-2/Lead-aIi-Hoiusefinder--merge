# RUNBOOK: Supervisor-Checkliste

> Dieses Runbook definiert die Pflichten des Supervisors (Mensch oder Review-Agent)
> bei der Überprüfung von Agent-Runs.

---

## 1. VOR dem Run (Pre-Flight)

### 1.1 Task-Scope prüfen
- [ ] Ist der Task klar definiert?
- [ ] Sind Grenzen gesetzt (welche Repos, welche Branches)?
- [ ] Sind sensitive Bereiche ausgeschlossen (Secrets, Prod-Daten)?

### 1.2 Agent-Config prüfen
- [ ] Welcher Agent wird verwendet?
- [ ] Welches Modell (Opus/Sonnet/Haiku)?
- [ ] Sind MCP-Server korrekt konfiguriert?

### 1.3 Permissions prüfen
- [ ] Sind nur notwendige Tools erlaubt?
- [ ] Sind risky Commands (rm -rf, git push --force) blockiert?
- [ ] Ist das Quality Gate aktiv? (`git config --get core.hooksPath` → `.githooks`)

---

## 2. WÄHREND des Runs (Monitoring)

### 2.1 Aktive Beobachtung
- [ ] Läuft der Agent im erwarteten Scope?
- [ ] Werden unerwartete Dateien/Verzeichnisse angefasst?
- [ ] Gibt es Secrets in der Ausgabe?

### 2.2 Intervention bei Bedarf
- [ ] Bei Abweichung: Agent stoppen (Ctrl+C / Escape)
- [ ] Bei Secrets-Leak: Sofort rotieren
- [ ] Bei unklarem Verhalten: Nachfragen stellen

---

## 3. NACH dem Run (Post-Run Review)

### 3.1 Run-Report prüfen
- [ ] Existiert `runs/<run_id>.json`?
- [ ] Sind alle Pflichtfelder ausgefüllt?
  - `run_id`, `agent`, `timestamp`
  - `summary`, `decisions`, `open_questions`
  - `risks`, `changes`, `next_actions`
  - `refs`, `redactions_done`
- [ ] Ist `redactions_done: true`?

### 3.2 Code-Änderungen prüfen
- [ ] `git diff` der Änderungen reviewen
- [ ] Keine hardcoded Secrets?
- [ ] Keine unerwarteten Dateien?
- [ ] Tests laufen durch?

### 3.3 Open Questions bearbeiten
- [ ] `ops/OPEN_QUESTIONS.md` prüfen
- [ ] Neue Einträge vom Run?
- [ ] Entscheidungen treffen oder eskalieren

### 3.4 Commit-Qualität
- [ ] Commit-Message aussagekräftig?
- [ ] Keine Secrets im Commit?
- [ ] Quality Gate PASSED?

---

## 4. Eskalation

### 4.1 Wann eskalieren?
- Secrets wurden exponiert
- Unerwartete Änderungen an Prod-Config
- Agent hat Scope verlassen
- Unklare/widersprüchliche Ergebnisse

### 4.2 Eskalations-Aktionen
1. Run stoppen / Änderungen reverten
2. Secrets rotieren (falls betroffen)
3. Incident dokumentieren in `ops/INCIDENTS.md`
4. Team informieren

---

## 5. Checkliste (Kurzform)

```
PRE-RUN:
[ ] Task klar?
[ ] Scope begrenzt?
[ ] Quality Gate aktiv?

DURING:
[ ] Im Scope?
[ ] Keine Secrets?

POST-RUN:
[ ] Run-Report vollständig?
[ ] redactions_done: true?
[ ] Code-Review OK?
[ ] Tests grün?
[ ] Open Questions bearbeitet?
```

---

## 6. Referenzen

- Quality Gate: `scripts/quality_gate.py`
- Run-Reports: `runs/*.json`
- Open Questions: `ops/OPEN_QUESTIONS.md`
- KB Policies: `policies/access_policy.yaml`

---

*Letzte Aktualisierung: 2026-01-14*
