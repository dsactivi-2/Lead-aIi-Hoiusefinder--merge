# FOLGE-PROTOKOLL: CRIME-KILLER (Behörden-System)

**Letzte Aktualisierung:** 2024-12-14 (Session 3)
**Repository:** https://github.com/devshift-stack/behoerden-system
**Lokal:** ~/devshift-stack/behoerden-system
**Version:** v0.1.0

---

## 📋 PROJEKT-ÜBERSICHT

**Was ist Crime-Killer / E-SPERRE?**
Ein behördliches Personen-Recherche-System für:

- Vermisste Personen finden
- Gefährdete Personen suchen
- Terrorprävention (Keyword-Listener)
- Kommunikationsanalyse
- Genehmigungsworkflows

**Zielgruppe:** Behörden mit richterlicher Genehmigung

---

## ✅ FERTIG (Stand: 14.12.2024)

### Core-Module

| Komponente            | Status | Datei                               |
| --------------------- | ------ | ----------------------------------- |
| Authentifizierung     | ✅     | `core/auth.py`                      |
| Audit-Logging         | ✅     | `core/audit.py`                     |
| Personensuche         | ✅     | `modules/person_search.py`          |
| Kommunikationsanalyse | ✅     | `modules/communication_analysis.py` |
| Keyword-Listener      | ✅     | `modules/listener.py`               |

### OSINT-Module (NEU - Session 3)

| Komponente           | Status | Datei                                   | Beschreibung                          |
| -------------------- | ------ | --------------------------------------- | ------------------------------------- |
| E-Mail Validierung   | ✅     | `modules/validators/email_validator.py` | Regex + MX-Record + Wegwerf-Erkennung |
| Telefon Validierung  | ✅     | `modules/validators/phone_validator.py` | DE/AT/CH/BA/HR/RS + Carrier-Erkennung |
| Gesichtserkennung    | ✅     | `modules/face_recognition_local.py`     | Lokal, keine Cloud, DSGVO-konform     |
| Social Media Checker | ✅     | `modules/social_media_checker.py`       | 12 Plattformen parallel               |
| E-Mail → Name        | ✅     | `modules/email_name_extractor.py`       | Pattern-Erkennung + 150+ Vornamen     |
| WHOIS Lookup         | ✅     | `modules/whois_lookup.py`               | 30+ TLDs (DE, AT, CH, BA, HR, RS...)  |

### Infrastruktur

| Komponente        | Status | Datei                          |
| ----------------- | ------ | ------------------------------ |
| Docker (Dev)      | ✅     | `docker-compose.yml`           |
| Docker (Prod)     | ✅     | `docker-compose.behoerde.yaml` |
| Dockerfile        | ✅     | `Dockerfile`                   |
| Nginx SSL         | ✅     | `nginx/nginx.conf`             |
| PostgreSQL Schema | ✅     | `deployment/init.sql`          |
| Makefile          | ✅     | `Makefile`                     |
| pyproject.toml    | ✅     | `pyproject.toml`               |

### Genehmigungssystem

| Komponente          | Status | Datei                                   |
| ------------------- | ------ | --------------------------------------- |
| Genehmigungsordnung | ✅     | `GENEHMIGUNGSORDNUNG.md`                |
| Workflow-Definition | ✅     | `workflow/genehmigungs-workflow.yaml`   |
| Workflow-Script     | ✅     | `scripts/genehmigung-workflow.sh`       |
| Antrags-Template    | ✅     | `dokumente/antraege/TEMPLATE_ANTRAG.md` |
| Rollen-Config       | ✅     | `config/genehmigungen.yaml`             |
| Audit-Config        | ✅     | `config/audit-logging.yaml`             |

### DevOps (NEU - Session 3)

| Komponente        | Status | Datei                                 |
| ----------------- | ------ | ------------------------------------- |
| GitHub Actions CI | ✅     | `.github/workflows/ci.yml`            |
| Dependabot        | ✅     | `.github/dependabot.yml`              |
| Branch-Schutz     | ✅     | main geschützt, 1 Review erforderlich |
| Git Workflow      | ✅     | `CONTRIBUTING.md`                     |

### Compliance & Rechtliches

| Komponente             | Status | Datei                         |
| ---------------------- | ------ | ----------------------------- |
| COMPLIANCE.md          | ✅     | DSGVO, GoBD, OZG, BITV        |
| RECHTLICHE_HINWEISE.md | ✅     | Haftung, Nutzung              |
| LICENSE                | ✅     | Proprietär für Behörden       |
| Backup-Script          | ✅     | `scripts/behoerden-backup.sh` |
| Starter-Script         | ✅     | `BEHOERDEN-STARTER.sh`        |

### Tests

| Test-Datei                       | Tests | Status          |
| -------------------------------- | ----- | --------------- |
| `tests/test_validators.py`       | 20    | ✅              |
| `tests/test_face_recognition.py` | 14    | ✅ (auf Server) |
| `tests/test_osint_modules.py`    | 28    | ✅              |

---

## 📝 TODO: NÄCHSTE SESSION

### NUR MIT API MÖGLICH

| Funktion        | API            | Kosten                | Priorität |
| --------------- | -------------- | --------------------- | --------- |
| Datenleck-Check | HaveIBeenPwned | Kostenlos (limitiert) | 🟡        |
| Telefon → Name  | Twilio Lookup  | ~0.005$/Anfrage       | 🟢        |
| E-Mail → Person | Hunter.io      | 25 Free/Monat         | 🟢        |

### Sonstige Verbesserungen

| Aufgabe                       | Priorität  |
| ----------------------------- | ---------- |
| Web-UI Dashboard              | 🔴 HOCH    |
| API-Endpoints (FastAPI/Flask) | 🔴 HOCH    |
| Deployment auf Server         | 🟡 MITTEL  |
| Monitoring & Alerting         | 🟢 NIEDRIG |

---

## 🛠️ NUTZUNG

### Module importieren

```python
# E-Mail Validierung
from modules.validators.email_validator import EmailValidator
validator = EmailValidator()
result = validator.validate("test@example.com")

# Telefon Validierung
from modules.validators.phone_validator import PhoneValidator
validator = PhoneValidator()
result = validator.validate("+49 151 12345678")

# Gesichtserkennung
from modules.face_recognition_local import FaceRecognitionLocal
fr = FaceRecognitionLocal()
fr.add_person("Max Mustermann", ["foto1.jpg", "foto2.jpg"])
result = fr.search_person("unbekannt.jpg")

# Social Media
from modules.social_media_checker import SocialMediaChecker
checker = SocialMediaChecker()
result = checker.check_username("max_mustermann")

# E-Mail → Name
from modules.email_name_extractor import EmailNameExtractor
extractor = EmailNameExtractor()
result = extractor.extract_name("max.mustermann@firma.de")

# WHOIS
from modules.whois_lookup import WhoisLookup
whois = WhoisLookup()
result = whois.lookup("beispiel.de")
```

### Server-Deployment

```bash
cd ~/devshift-stack/behoerden-system
./BEHOERDEN-STARTER.sh
docker-compose -f docker-compose.behoerde.yaml up -d
```

### Git Workflow

```bash
# Auf develop arbeiten
git checkout develop

# Änderungen pushen
git add -A && git commit -m "feat: Beschreibung" && git push

# PR nach main erstellen
gh pr create --base main --title "Release: v0.2.0"
```

---

## 📊 PROJEKT-STATISTIK

| Metrik       | Wert                   |
| ------------ | ---------------------- |
| Dateien      | 50+                    |
| Code-Zeilen  | 5000+                  |
| Module       | 6 OSINT-Module         |
| Tests        | 62 (alle bestanden)    |
| Docker-ready | ✅ Dev + Prod          |
| Compliance   | DSGVO, GoBD, OZG, BITV |
| CI/CD        | ✅ GitHub Actions      |
| Version      | v0.1.0                 |

---

## 🔗 LINKS

- **GitHub:** https://github.com/devshift-stack/behoerden-system
- **Release v0.1.0:** https://github.com/devshift-stack/behoerden-system/releases/tag/v0.1.0

---

## 🔐 .ENV PASSWÖRTER (lokal in .env, nicht im Git)

```
DB_PASSWORD=[in .env]
REDIS_PASSWORD=[in .env]
SECRET_KEY=[in .env]
```

---

**Status:** Alle selbst-programmierbaren Module sind FERTIG. Nächster Schritt: Web-UI oder API-Endpoints.
