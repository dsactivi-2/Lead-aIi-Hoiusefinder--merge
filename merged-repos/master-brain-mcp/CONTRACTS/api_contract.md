# API Contract

> **REGEL:** Frontend und Backend dürfen NUR das verwenden, was hier steht.
> Änderungen nur mit expliziter Genehmigung: `ÄNDERUNG ERLAUBT: ...`

**Version:** 1.0.0
**Letzte Änderung:** YYYY-MM-DD

---

## Konventionen

### Request Format
- Content-Type: `application/json`
- Auth: `Authorization: Bearer <token>`

### Response Format
```json
// Erfolg
{
  "data": { ... }
}

// oder direkt das Objekt
{ ... }

// Liste
[{ ... }, { ... }]
```

### Error Format
```json
{
  "error": "Kurze Fehlermeldung"
}

// oder detailliert
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Beschreibung",
    "details": { "field": "Fehler" }
  }
}
```

### HTTP Status Codes
| Code | Bedeutung |
|------|-----------|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request (Validation Error) |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

---

## System Endpoints (PFLICHT)

### GET /health
**Auth:** Keine
**Rate Limit:** Keine

**Response 200:**
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

**Response 500:**
```json
{
  "status": "error",
  "timestamp": "2026-01-18T12:00:00Z",
  "db": {
    "status": "disconnected",
    "error": "Connection refused"
  }
}
```

### GET /api-docs
**Auth:** Keine
**Response:** Swagger UI HTML

---

## Auth Endpoints (falls benötigt)

### POST /auth/login
**Auth:** Keine

**Request:**
```json
{
  "email": "user@example.com",
  "password": "secret"
}
```

**Response 200:**
```json
{
  "token": "eyJ...",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

**Errors:** 400, 401, 429

---

## Business Endpoints

### [ENDPOINT_NAME]
**Method:** GET/POST/PUT/DELETE
**Path:** /path
**Auth:** Required/None

**Request:**
```json
{
  "field": "type"
}
```

**Response 200:**
```json
{
  "field": "value"
}
```

**Errors:** 400, 401, 404, 500

---

## Pagination (Standard)

Für Listen-Endpoints:

**Query Parameters:**
- `limit` (default: 20, max: 100)
- `offset` (default: 0)

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "total": 100,
    "limit": 20,
    "offset": 0,
    "has_more": true
  }
}
```

---

## Changelog

| Datum | Änderung | Genehmigt von |
|-------|----------|---------------|
| YYYY-MM-DD | Initial | ... |
