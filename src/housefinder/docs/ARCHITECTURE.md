# ARCHITECTURE

## Systemübersicht

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│   API       │────▶│  Database   │
│  (Browser)  │     │  (Backend)  │     │ (PostgreSQL)│
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │ Integrations│
                    │ (optional)  │
                    └─────────────┘
```

## Komponenten

### 1. API (Backend)
- **Framework:** Express / Fastify / Hono
- **Sprache:** TypeScript / JavaScript
- **Port:** 8080 (default)

**Middleware Stack:**
1. CORS
2. Request Logging (pino)
3. Body Parser (JSON)
4. Rate Limiting
5. Auth (für geschützte Routes)

### 2. Database
- **Type:** PostgreSQL (empfohlen) / SQLite
- **ORM:** Prisma / Drizzle / Raw SQL
- **Connection Pool:** 10 connections (default)

### 3. Frontend (optional)
- **Framework:** Next.js / React / Vue
- **Styling:** Tailwind / CSS Modules
- **State:** React Query / Zustand

## Datenfluss

```
1. Client sendet Request
   │
2. CORS Prüfung
   │
3. Rate Limit Check
   │
4. Auth Validation (falls nötig)
   │
5. Input Validation
   │
6. Business Logic
   │
7. Database Query
   │
8. Response Formatting
   │
9. Logging
   │
10. Response an Client
```

## Security

### Implementiert (PFLICHT)
- [x] Rate Limiting (express-rate-limit)
- [x] CORS (konfigurierbar)
- [x] Input Validation
- [x] Parameterized Queries
- [x] Auth via Bearer Token
- [x] No secrets in code

### Empfohlen
- [ ] Helmet.js (Security Headers)
- [ ] HTTPS only
- [ ] CSP Headers

## Error Handling

```javascript
// Alle Errors folgen diesem Format
{
  "error": "Kurze Beschreibung"
}

// Kein Stack Trace in Production!
```

## Logging

```javascript
// Strukturiertes Logging mit pino
{
  "level": "info",
  "time": 1705500000000,
  "msg": "Request completed",
  "req": { "method": "GET", "url": "/health" },
  "res": { "statusCode": 200 },
  "responseTime": 5
}
```

## Skalierung

### Horizontal
- Stateless API → Load Balancer ready
- DB Connection Pool pro Instance

### Vertikal
- DB Pool Size erhöhen
- Node.js Cluster Mode

## Monitoring

### Health Check
- `GET /health` prüft DB Connection
- Latency Messung

### Empfohlen
- Sentry für Error Tracking
- Prometheus für Metrics
- Grafana für Dashboards

## Entscheidungen

Architektur-Entscheidungen werden in `ops/DECISIONS.md` dokumentiert.
