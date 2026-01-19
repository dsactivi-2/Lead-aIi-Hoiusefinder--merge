# CI Scripts

> Hilfsskripte für CI/CD Pipeline.

---

## Verfügbare Scripts

| Script | Zweck |
|--------|-------|
| `smoke_test.sh` | Smoke Test gegen Live-URL |
| `check_contracts.sh` | Prüft Contract-Einhaltung |
| `secrets_scan.sh` | Scannt nach Secrets |

---

## Verwendung

```bash
# Smoke Test
./scripts/ci/smoke_test.sh https://your-app.com

# Contract Check
./scripts/ci/check_contracts.sh

# Secrets Scan
./scripts/ci/secrets_scan.sh
```
