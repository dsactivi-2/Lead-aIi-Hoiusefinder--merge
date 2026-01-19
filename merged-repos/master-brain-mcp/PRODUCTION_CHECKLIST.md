# PRODUCTION CHECKLIST

> **PFLICHT:** Alle Punkte müssen abgehakt sein BEVOR das Projekt live geht.
> Keine Ausnahmen. Kein "machen wir später".

---

## 1. API Security (KRITISCH)

### 1.1 Rate Limiting
- [ ] Rate Limiter implementiert (express-rate-limit / fastify-rate-limit)
- [ ] Konfigurierbar via ENV: `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`
- [ ] Standard: 100 requests/minute pro IP
- [ ] Response bei Überschreitung: `429 Too Many Requests`
- [ ] Response Format: `{ "error": "Too many requests, please try again later" }`

```javascript
// Beispiel
const limiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW_MS || 60000,
  max: process.env.RATE_LIMIT_MAX || 100,
  message: { error: 'Too many requests' }
});
```

### 1.2 CORS
- [ ] CORS Middleware aktiv
- [ ] Erlaubte Origins via ENV: `CORS_ORIGIN`
- [ ] Erlaubte Methods: GET, POST, PUT, DELETE
- [ ] Erlaubte Headers: Content-Type, Authorization
- [ ] Credentials-Handling korrekt

```javascript
// Beispiel
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
```

### 1.3 Input Validation
- [ ] ALLE User-Inputs validiert
- [ ] Type-Checks (string, number, array, etc.)
- [ ] Length-Limits (min/max)
- [ ] Format-Validierung (email, URL, etc.)
- [ ] Array-Längen begrenzt
- [ ] Nested Objects begrenzt
- [ ] Keine SQL Injection möglich (Parameterized Queries)
- [ ] Keine XSS möglich (Output Encoding)

### 1.4 Authentication
- [ ] Auth Middleware für geschützte Routes
- [ ] Token-Validierung
- [ ] Token-Expiry prüfen
- [ ] Unauthorized Response: `401 { "error": "Unauthorized" }`

---

## 2. API Documentation (PFLICHT)

### 2.1 OpenAPI/Swagger
- [ ] `swagger.json` oder `openapi.yaml` vorhanden
- [ ] OpenAPI Version: 3.0.x
- [ ] Info-Block ausgefüllt (title, description, version, contact)
- [ ] Server URLs definiert (dev, production)
- [ ] Security Schemes definiert (Bearer Auth)

### 2.2 Alle Endpoints dokumentiert
- [ ] Path + Method
- [ ] Summary + Description
- [ ] Parameters (query, path, header)
- [ ] Request Body Schema
- [ ] Response Schemas (200, 400, 401, 404, 429, 500)
- [ ] Beispiele für Request/Response

### 2.3 Swagger UI
- [ ] `/api-docs` Endpoint aktiv
- [ ] Swagger UI zeigt alle Endpoints
- [ ] "Try it out" funktioniert
- [ ] Auth-Header kann eingegeben werden

---

## 3. Logging (PFLICHT)

### 3.1 Strukturiertes Logging
- [ ] Logger-Library verwendet (pino, winston, bunyan)
- [ ] JSON Format in Production
- [ ] Log Level via ENV: `LOG_LEVEL`
- [ ] Pretty-Print in Development

### 3.2 Was geloggt werden MUSS
- [ ] Server Start mit Port
- [ ] Alle Requests (Method, Path, Status, Duration)
- [ ] Alle Errors mit Stack Trace (nur intern, nicht in Response)
- [ ] Auth Failures (IP, Timestamp)
- [ ] Rate Limit Hits
- [ ] Database Errors
- [ ] Graceful Shutdown

### 3.3 Was NICHT geloggt werden darf
- [ ] Passwörter
- [ ] API Keys/Tokens
- [ ] Persönliche Daten (PII)
- [ ] Credit Card Numbers

---

## 4. Error Handling (PFLICHT)

### 4.1 Global Error Handler
- [ ] Catch-All Error Handler implementiert
- [ ] Keine Stack Traces in Production Response
- [ ] Einheitliches Error Format: `{ "error": "message" }`
- [ ] Logging des vollen Errors intern

### 4.2 404 Handler
- [ ] 404 für unbekannte Routes
- [ ] Response: `{ "error": "Not found" }`

### 4.3 Graceful Shutdown
- [ ] SIGTERM Handler
- [ ] SIGINT Handler
- [ ] DB Connections schließen
- [ ] Laufende Requests abwarten
- [ ] Clean Exit

```javascript
// Beispiel
const shutdown = async () => {
  logger.info('Shutting down...');
  await pool.end();
  process.exit(0);
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
```

---

## 5. Health Check (PFLICHT)

### 5.1 /health Endpoint
- [ ] `GET /health` ohne Auth erreichbar
- [ ] Prüft Datenbankverbindung
- [ ] Response Format:

```json
{
  "status": "ok",
  "timestamp": "2026-01-18T12:00:00Z",
  "version": "1.0.0",
  "db": {
    "status": "connected",
    "latency_ms": 5
  }
}
```

### 5.2 Bei DB-Fehler
- [ ] Status: 500
- [ ] `db.status: "disconnected"`
- [ ] Error Message (ohne sensitive Daten)

---

## 6. Environment & Secrets (PFLICHT)

### 6.1 .env.example
- [ ] Alle ENV Variables dokumentiert
- [ ] Keine echten Secrets drin
- [ ] Kommentare für jede Variable

```bash
# Server
PORT=8080
NODE_ENV=development
LOG_LEVEL=info

# Database
DATABASE_URL=postgres://user:pass@localhost:5432/dbname
DB_POOL_MAX=10

# Auth
API_TOKEN=your_token_here

# Security
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100
```

### 6.2 Secrets Management
- [ ] Keine Secrets im Code
- [ ] Keine Secrets in Git
- [ ] .env in .gitignore
- [ ] Secrets via ENV oder Secret Manager

---

## 7. Database (PFLICHT)

### 7.1 Connection Pool
- [ ] Connection Pool konfiguriert
- [ ] Max Connections via ENV
- [ ] Idle Timeout konfiguriert
- [ ] Connection Timeout konfiguriert
- [ ] Error Handler für Pool Errors

### 7.2 Queries
- [ ] Parameterized Queries (keine String Concatenation)
- [ ] Indizes für häufige Queries
- [ ] Query Timeouts

---

## 8. Tests (PFLICHT)

### 8.1 Minimum Test Coverage
- [ ] Unit Tests für Business Logic
- [ ] Integration Tests für API Endpoints
- [ ] Auth Tests (valid/invalid token)
- [ ] Validation Tests (valid/invalid input)
- [ ] Error Handling Tests

### 8.2 Test Commands
- [ ] `npm test` läuft durch
- [ ] Tests in CI/CD Pipeline

---

## 9. CI/CD (PFLICHT)

### 9.1 GitHub Actions
- [ ] Lint on PR
- [ ] Tests on PR
- [ ] Build Check on PR
- [ ] Auto-Deploy on main (optional)

### 9.2 Quality Gates
- [ ] Alle Tests müssen grün sein
- [ ] Lint muss grün sein
- [ ] Build muss erfolgreich sein

---

## 10. Benutzeranleitungen (PFLICHT)

### 10.1 Quick Start Guide
- [ ] `guides/QUICK_START.md` existiert
- [ ] Keine Platzhalter mehr (alle [Text] ersetzt)
- [ ] Echte Screenshots eingefügt
- [ ] Schritt-für-Schritt Anleitung vollständig

### 10.2 Feature Guides
- [ ] Für jede Hauptfunktion eine Anleitung
- [ ] Bilder/Screenshots in `guides/assets/`
- [ ] Einfache Sprache (für Endbenutzer)
- [ ] Beispiele aus der Praxis

### 10.3 Guide Qualität
- [ ] Max. 2-3 Seiten pro Guide
- [ ] Nummerierte Schritte
- [ ] Häufige Fragen beantwortet
- [ ] Support-Kontakt angegeben

---

## 11. Monitoring (EMPFOHLEN)

### 10.1 Error Tracking
- [ ] Sentry oder ähnlich integriert
- [ ] Source Maps hochgeladen
- [ ] Environment Tags

### 10.2 Metrics
- [ ] Request Count
- [ ] Response Times
- [ ] Error Rate
- [ ] DB Connection Pool Status

### 10.3 Alerting
- [ ] Alert bei Error Spike
- [ ] Alert bei hoher Latenz
- [ ] Alert bei DB Connection Failure

---

## Finale Checkliste

```
SECURITY:
[ ] Rate Limiting ✓
[ ] CORS ✓
[ ] Input Validation ✓
[ ] Auth ✓

DOCUMENTATION:
[ ] Swagger/OpenAPI ✓
[ ] /api-docs erreichbar ✓

RELIABILITY:
[ ] Structured Logging ✓
[ ] Error Handler ✓
[ ] 404 Handler ✓
[ ] Graceful Shutdown ✓
[ ] Health Check ✓

ENVIRONMENT:
[ ] .env.example vollständig ✓
[ ] Keine Secrets im Code ✓

DATABASE:
[ ] Connection Pool ✓
[ ] Parameterized Queries ✓

TESTS:
[ ] Unit Tests ✓
[ ] Integration Tests ✓
[ ] CI/CD Pipeline ✓

USER GUIDES:
[ ] Quick Start Guide ✓
[ ] Feature Guides ✓
[ ] Screenshots vorhanden ✓
```

---

**Unterschrift:** _______________
**Datum:** _______________
**Reviewer:** _______________
