# PROMPTS - Workflow Anleitung

> So verwendest du die Prompts für ein neues Projekt.

---

## Der Workflow (3 Stufen)

```
┌─────────────────────────────────────────────────────────────────┐
│  STUFE 0: INTAKE                                                │
│  Du beschreibst in DEINEN Worten was du willst                  │
│  → Agent macht strukturierte Beschreibung                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  STUFE 1: PLANUNG (PROMPT_1)                                    │
│  Agent denkt ZIEL-ORIENTIERT mit:                               │
│  - Was ist das eigentliche Ziel?                                │
│  - Welche Tools/APIs/DBs sind nötig?                            │
│  - Welche Prozesse/Flows?                                       │
│  - Welche Tests?                                                │
│  - Was könnte der User vergessen haben?                         │
│  → Erstellt alle Projekt-Artefakte                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  STUFE 2: IMPLEMENTIERUNG (PROMPT_2)                            │
│  Agent arbeitet Step-by-Step nach MASTER_RUNBOOK                │
│  → Code, Tests, Deployment                                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Schritt-für-Schritt

### Schritt 1: Deine Idee beschreiben

Öffne einen Chat und beschreibe in **deinen eigenen Worten** was du willst:

```
Ich will ein Tool das [BESCHREIBUNG].
Es soll [FUNKTION 1], [FUNKTION 2], [FUNKTION 3].
Benutzer sind [ZIELGRUPPE].
```

Du musst nicht technisch sein. Einfach erklären was das Ziel ist.

### Schritt 2: INTAKE_PROMPT verwenden

Kopiere `INTAKE_PROMPT.md` in den Chat und füge deine Beschreibung ein.

Der Agent wird:
- Rückfragen stellen (max 7)
- Eine strukturierte Beschreibung erstellen

**Ergebnis:** Eine saubere Projekt-Beschreibung

### Schritt 3: MASTER_PROMPT_1 verwenden

1. Neuen Chat öffnen
2. `MASTER_PROMPT_1.md` kopieren
3. Die strukturierte Beschreibung aus Schritt 2 einfügen
4. Absenden

Der Agent wird **ZIEL-ORIENTIERT mitdenken**:
- Nicht nur einbauen was du sagst
- Überlegen was WIRKLICH nötig ist
- Tools, APIs, DBs vorschlagen
- Prozesse und Flows planen
- Tests planen
- Risiken identifizieren

**Ergebnis:** Alle Projekt-Artefakte (PROJECT_STATE, CONTRACTS, capabilities.yml, etc.)

### Schritt 4: MASTER_PROMPT_2 verwenden

1. Artefakte in die Dateien kopieren
2. Neuen Chat öffnen (oder im selben weiter)
3. `MASTER_PROMPT_2.md` kopieren
4. Sagen: "Starte Step 1 aus dem MASTER_RUNBOOK"

Der Agent arbeitet jetzt Step-by-Step.

### Bei langem Chat

Wenn der Chat zu lang wird:
1. `PROJECT_SNAPSHOT.md` aktualisieren
2. Neuen Chat öffnen
3. `MASTER_PROMPT_2.md` + Snapshot einfügen
4. Weiterarbeiten

---

## Dateien in diesem Ordner

| Datei | Wann verwenden |
|-------|----------------|
| `INTAKE_PROMPT.md` | Am Anfang - Idee strukturieren |
| `MASTER_PROMPT_1.md` | Nach Intake - Projekt planen |
| `MASTER_PROMPT_2.md` | Nach Planung - Implementieren |

---

## Wichtig

**PROMPT_1 ist ZIEL-ORIENTIERT:**

❌ FALSCH: "Der User sagt Login, also baue ich Login"

✅ RICHTIG: "Der User will Login. Das bedeutet:
- Auth-System (JWT oder Session?)
- User-Tabelle in DB
- Password-Hashing
- Token-Management
- Rate Limiting für Login
- Passwort-Reset Flow?
- OAuth optional?
- Tests für Auth
- Swagger Docs für Auth Endpoints"

Der Agent denkt mit und fragt nach, statt nur umzusetzen.
