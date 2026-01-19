# CONTRACT VERIFICATION

> Prüft ob Frontend, Backend und Database die gleiche Sprache sprechen.
> **Wann:** Nach Step 7 (Frontend), VOR Step 8 (QA).

---

## 1. Contracts finalisiert?

### API Contract
- [ ] `CONTRACTS/api_contract.md` ist final
- [ ] Alle Endpoints definiert
- [ ] Request/Response Schemas dokumentiert
- [ ] Error Responses dokumentiert
- [ ] Keine offenen TODOs

### Data Contract
- [ ] `CONTRACTS/data_contract.md` ist final
- [ ] Alle Tabellen definiert
- [ ] Relationen dokumentiert
- [ ] Indizes definiert
- [ ] Migrations vorhanden

---

## 2. Frontend ↔ Backend

> Stimmen die API-Aufrufe im Frontend mit den Routes im Backend überein?

- [ ] Alle API-Pfade identisch
- [ ] Alle Request-Felder identisch (Namen, Types)
- [ ] Alle Response-Felder identisch
- [ ] Error-Handling konsistent
- [ ] Auth-Header korrekt

### Prüfung

```bash
# Frontend API Calls finden
grep -rn "fetch\|axios\|api\." src/frontend/ --include="*.ts" --include="*.tsx" --include="*.js"

# Backend Routes finden
grep -rn "app.get\|app.post\|app.put\|app.delete\|router\." src/backend/ --include="*.ts" --include="*.js"

# Vergleiche die Pfade manuell
```

### Häufige Fehler

| Problem | Frontend | Backend | Fix |
|---------|----------|---------|-----|
| Prefix | `/api/users` | `/users` | Einheitlich machen |
| Casing | `userId` | `user_id` | snake_case verwenden |
| Typo | `/bookigns` | `/bookings` | Korrigieren |

---

## 3. Backend ↔ Database

> Stimmen die Queries im Backend mit dem DB Schema überein?

- [ ] Alle Queries gegen Contract geprüft
- [ ] Keine fehlenden Felder
- [ ] Keine fehlenden Tabellen
- [ ] Migrations getestet
- [ ] Seed Data vorhanden

### Prüfung

```bash
# DB Queries im Code finden
grep -rn "SELECT\|INSERT\|UPDATE\|DELETE" src/backend/ --include="*.ts" --include="*.js"

# Oder bei ORM (Prisma/Drizzle)
grep -rn "prisma\.\|db\." src/backend/ --include="*.ts" --include="*.js"

# Vergleiche Felder mit CONTRACTS/data_contract.md
```

### Häufige Fehler

| Problem | Code | Contract | Fix |
|---------|------|----------|-----|
| Feld fehlt | `SELECT name` | `users: id, name, email` | Feld hinzufügen |
| Falscher Name | `user_name` | `name` | Namen korrigieren |
| Tabelle fehlt | `FROM sessions` | Nicht definiert | Contract erweitern |

---

## Signoff

| Bereich | Status | Prüfer | Datum |
|---------|--------|--------|-------|
| Contracts finalisiert | ⬜ | | |
| Frontend ↔ Backend | ⬜ | | |
| Backend ↔ Database | ⬜ | | |

**Alle ⬜ müssen ✅ sein bevor Step 8 (QA) beginnt!**

---

## Nächster Schritt

Nach erfolgreicher Verification → `PRODUCTION_CHECKLIST.md` durcharbeiten.
