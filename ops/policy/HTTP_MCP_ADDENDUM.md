# HTTP/MCP Protocol Addendum

> Policy für die Klassifizierung und das Testen von Capabilities nach Protokoll-Modus.

## 1. Protokoll-Modi

| Mode | Beschreibung | Erforderliche Tests |
|------|--------------|---------------------|
| `HTTP` | Nur HTTP/REST API | `http:` Tests |
| `MCP` | Nur MCP Protocol | `mcp:` Tests |
| `BOTH` | HTTP und MCP | `http:` UND `mcp:` Tests |

## 2. Test-Anforderungen pro Mode

### HTTP Mode
```yaml
mode: HTTP
tests:
  - http:endpoint_returns_200
  - http:payload_validation
```

### MCP Mode
```yaml
mode: MCP
tests:
  - mcp:tool_registration
  - mcp:tool_execution
```

### BOTH Mode
```yaml
mode: BOTH
tests:
  - http:endpoint_returns_200
  - mcp:tool_registration
  # Beide Protokolle MÜSSEN getestet werden
```

## 3. Side Effects und Readback

Wenn `side_effect: true`:
- **PFLICHT:** `readback:` Tests müssen vorhanden sein
- Readback verifiziert, dass die Änderung tatsächlich persistiert wurde

```yaml
side_effect: true
readback_tests:
  - readback:verify_created
  - readback:verify_updated
```

## 4. Enforcement

Der CI-Check `check_capabilities.py` FAIL wenn:
- `mode: BOTH` aber nur ein Protokoll getestet
- `side_effect: true` aber keine `readback:` Tests
- Tests fehlen für den angegebenen Mode
