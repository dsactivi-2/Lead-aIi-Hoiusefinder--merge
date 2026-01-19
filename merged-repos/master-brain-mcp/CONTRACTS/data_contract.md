# Data Contract

> **REGEL:** DB Felder/Tabellen hier definieren. Keine stillen Änderungen.
> Änderungen nur mit expliziter Genehmigung: `ÄNDERUNG ERLAUBT: ...`

**Version:** 1.0.0
**Database:** PostgreSQL / SQLite / MongoDB
**Letzte Änderung:** YYYY-MM-DD

---

## Konventionen

### Naming
- Tabellen: `snake_case`, Plural (`users`, `audit_logs`)
- Felder: `snake_case`
- Primary Keys: `id`
- Foreign Keys: `{table}_id`
- Timestamps: `created_at`, `updated_at`

### Standard-Felder (empfohlen für jede Tabelle)
```sql
id            UUID/SERIAL PRIMARY KEY
created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
```

---

## Tabellen

### users (falls Auth benötigt)
```sql
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),           -- NULL für OAuth/MagicLink
  name          VARCHAR(255),
  role          VARCHAR(50) DEFAULT 'user',
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
```

### audit_logs (empfohlen)
```sql
CREATE TABLE audit_logs (
  id          SERIAL PRIMARY KEY,
  user_id     UUID REFERENCES users(id),
  action      VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100),
  entity_id   VARCHAR(255),
  payload     JSONB,
  ip_address  INET,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);
```

### [YOUR_TABLE]
```sql
CREATE TABLE your_table (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Felder hier
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indizes
CREATE INDEX idx_your_table_field ON your_table(field);
```

---

## Relationen

```
users 1──────< audit_logs
      └──────< [your_relations]
```

---

## Indizes (Pflicht)

Für jede Tabelle dokumentieren:

| Tabelle | Index | Felder | Grund |
|---------|-------|--------|-------|
| users | idx_users_email | email | Login-Lookup |
| audit_logs | idx_audit_user | user_id | User-History |
| audit_logs | idx_audit_created | created_at DESC | Recent Logs |

---

## Migrations

Migrations werden in `/migrations/` oder via ORM verwaltet.

```
migrations/
├── 001_initial_schema.sql
├── 002_add_users.sql
└── 003_add_audit_logs.sql
```

---

## Seed Data

Initiale Daten in `/seeds/` oder `init.sql`:

```sql
-- Beispiel: Admin User
INSERT INTO users (email, password_hash, role)
VALUES ('admin@example.com', '$2b$...', 'admin');
```

---

## Changelog

| Datum | Änderung | Genehmigt von |
|-------|----------|---------------|
| YYYY-MM-DD | Initial Schema | ... |
