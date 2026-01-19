# RUNBOOK: Supervisor-Checkliste

> Pflichten des Supervisors (Mensch oder Review-Agent) bei der Überprüfung.

---

## 1. VOR dem Work (Pre-Flight)

### 1.1 Task-Scope prüfen
- [ ] Ist der Task klar definiert?
- [ ] Sind Grenzen gesetzt (welche Dateien, welche Features)?
- [ ] Sind sensitive Bereiche ausgeschlossen (Secrets, Prod-Daten)?

### 1.2 Contracts prüfen
- [ ] API Contract verstanden?
- [ ] Data Contract verstanden?
- [ ] Keine unerlaubten Änderungen geplant?

### 1.3 Permissions prüfen
- [ ] Sind nur notwendige Zugriffe erlaubt?
- [ ] Sind risky Commands blockiert?

---

## 2. WÄHREND der Arbeit (Monitoring)

### 2.1 Aktive Beobachtung
- [ ] Arbeitet im erwarteten Scope?
- [ ] Werden unerwartete Dateien angefasst?
- [ ] Keine Secrets in Output?

### 2.2 Intervention bei Bedarf
- [ ] Bei Abweichung: STOPP
- [ ] Bei Secrets-Leak: Sofort rotieren
- [ ] Bei unklarem Verhalten: Nachfragen

---

## 3. NACH der Arbeit (Post-Review)

### 3.1 Code-Änderungen prüfen
- [ ] `git diff` reviewen
- [ ] Keine hardcoded Secrets?
- [ ] Keine unerwarteten Dateien?
- [ ] Tests laufen durch?

### 3.2 Contracts eingehalten?
- [ ] API Contract eingehalten?
- [ ] Data Contract eingehalten?
- [ ] Keine stillen Änderungen?

### 3.3 Production Checklist
- [ ] Rate Limiting berücksichtigt?
- [ ] Input Validation vorhanden?
- [ ] Error Handling korrekt?
- [ ] Logging implementiert?

### 3.4 Tests
- [ ] Unit Tests hinzugefügt?
- [ ] Tests grün?

---

## 4. Eskalation

### 4.1 Wann eskalieren?
- Secrets wurden exponiert
- Unerwartete Änderungen
- Scope verlassen
- Widersprüchliche Ergebnisse

### 4.2 Eskalations-Aktionen
1. Arbeit stoppen
2. Änderungen reverten
3. Secrets rotieren (falls betroffen)
4. Incident dokumentieren

---

## 5. Checkliste (Kurzform)

```
PRE:
[ ] Task klar?
[ ] Scope begrenzt?
[ ] Contracts verstanden?

DURING:
[ ] Im Scope?
[ ] Keine Secrets?

POST:
[ ] Code Review OK?
[ ] Tests grün?
[ ] Contracts eingehalten?
[ ] Production Checklist OK?
```
