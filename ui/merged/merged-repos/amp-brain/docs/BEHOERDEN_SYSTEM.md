# Behörden-System (E-SPERRE) - Dokumentation

**Erstellt:** 2024-12-14
**Repository:** https://github.com/devshift-stack/behoerden-system

## Übersicht

Das E-SPERRE System ist ein behördliches Personen-Recherche-System für autorisierte Ermittlungen.

## Module

### 1. PersonSearchEngine (`modules/person_search.py`)

Sucht Personen anhand verschiedener Identifikatoren:

- Name
- E-Mail
- Telefonnummer
- Bild (Gesichtserkennung)

**Wichtig:** Vollprofil erfordert richterliche Anordnung!

### 2. CommunicationAnalyzer (`modules/communication_analysis.py`)

Analysiert:

- Telefonnummern (Carrier, Typ, Validierung)
- E-Mail-Adressen (Disposable, Business, Breaches)
- Kommunikationsmuster (erfordert Warrant)

### 3. KeywordListener (`modules/listener.py`)

Überwacht öffentliche Quellen auf definierte Keywords.

**Verwendung:**

```python
listener = KeywordListener()
listener.configure(
    keywords=["Bombenanschlag"],
    regions=["Berlin"],
    case_id="CASE-001",
    officer_id="OFFICER-001",
    warrant_number="WARRANT-001"  # PFLICHT!
)
listener.start()
```

**Location-Handling:**

- `use_geo_ip`: IP-basierte Lokalisierung
- `use_content_location`: Content-basierte Lokalisierung
- Löst Problem: Server in USA, aber Content aus Bihac

### 4. AuditLogger (`core/audit.py`)

Protokolliert ALLE Aktionen:

- Zeitstempel
- User-ID
- Case-ID
- Warrant-Number
- IP-Adresse
- Prüfsumme (Integrität)

Export für Gericht:

```python
audit.export_for_court("CASE-001")
```

## Rechtliche Anforderungen

| Aktion              | Warrant erforderlich? |
| ------------------- | --------------------- |
| Einfache Suche      | ❌ Nein               |
| Vollprofil          | ✅ Ja                 |
| Musteranalyse       | ✅ Ja                 |
| Listener aktivieren | ✅ Ja                 |

## Installation

```bash
cd ~/devshift-stack/behoerden-system
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py --demo
```

## Tests

```bash
pytest tests/
```

## Quellen

- DeepSeek Chat: https://chat.deepseek.com/share/mwyrgv7qal0paf9x7u
- Lokales Repo: ~/devshift-stack/behoerden-system
- GitHub: https://github.com/devshift-stack/behoerden-system
