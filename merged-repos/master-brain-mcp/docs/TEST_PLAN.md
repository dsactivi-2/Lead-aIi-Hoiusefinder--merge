# TEST_PLAN

> Praktische Anleitung für Tests: Befehle, Struktur, Frameworks.

---

## Test-Regeln & Pflichten

> **→ Siehe `capabilities.yml`** für alle Test-Regeln.
>
> Dort sind definiert:
> - Testarten (`unit:`, `http:`, `integration:`, `e2e:`, `smoke:`, `readback:`)
> - Pflicht-Regeln (welche Capability welche Tests braucht)
> - Konkrete Test-Namen pro Feature

---

## Test-Befehle

```bash
# Alle Tests
npm test

# Unit Tests
npm run test:unit

# Integration Tests
npm run test:integration

# E2E Tests
npm run test:e2e

# Coverage
npm run test:coverage

# Smoke Test (gegen Live)
./scripts/smoke_test.sh https://your-app.com
```

## Test-Struktur

```
tests/
├── unit/
│   ├── validation.test.js
│   ├── auth.test.js
│   └── ...
├── integration/
│   ├── health.test.js
│   ├── api.test.js
│   └── ...
├── e2e/
│   └── journeys/
│       ├── login.test.js
│       └── ...
└── fixtures/
    └── ...
```

## Test-Framework

- **Runner:** Jest / Vitest
- **HTTP Tests:** Supertest
- **E2E:** Playwright / Cypress
- **Mocking:** Jest Mocks / MSW

## Coverage Ziele

| Bereich | Minimum |
|---------|---------|
| Unit Tests | 80% |
| Integration | Alle Endpoints |
| E2E | Kritische Journeys |

## CI Integration

Tests laufen automatisch bei:
- Pull Requests
- Push auf `main`
- Vor Deploy

Siehe `.github/workflows/ci.yml`
