# Schemas

> JSON Schemas für API Request/Response Validation.

---

## Zweck

- Validierung von API Inputs
- Dokumentation von Datenstrukturen
- Code-Generierung (optional)

---

## Struktur

```
schemas/
├── README.md
├── common/
│   ├── pagination.json
│   └── error.json
├── requests/
│   ├── create_booking.json
│   └── update_user.json
└── responses/
    ├── booking.json
    └── user.json
```

---

## Beispiel: Error Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "error.json",
  "title": "Error Response",
  "type": "object",
  "required": ["error"],
  "properties": {
    "error": {
      "oneOf": [
        { "type": "string" },
        {
          "type": "object",
          "properties": {
            "code": { "type": "string" },
            "message": { "type": "string" },
            "details": { "type": "object" }
          },
          "required": ["code", "message"]
        }
      ]
    }
  }
}
```

---

## Beispiel: Pagination Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "pagination.json",
  "title": "Pagination",
  "type": "object",
  "properties": {
    "total": { "type": "integer", "minimum": 0 },
    "limit": { "type": "integer", "minimum": 1, "maximum": 100 },
    "offset": { "type": "integer", "minimum": 0 },
    "has_more": { "type": "boolean" }
  },
  "required": ["total", "limit", "offset", "has_more"]
}
```

---

## Verwendung im Code

```javascript
import Ajv from 'ajv';
import createBookingSchema from './schemas/requests/create_booking.json';

const ajv = new Ajv();
const validate = ajv.compile(createBookingSchema);

function validateCreateBooking(data) {
  const valid = validate(data);
  if (!valid) {
    throw new Error(validate.errors.map(e => e.message).join(', '));
  }
  return data;
}
```

---

## Schema zu Contract Mapping

| Schema | Contract Referenz |
|--------|-------------------|
| `requests/*.json` | `CONTRACTS/api_contract.md` Request Bodies |
| `responses/*.json` | `CONTRACTS/api_contract.md` Response Bodies |
| `common/error.json` | `CONTRACTS/api_contract.md` Error Format |
