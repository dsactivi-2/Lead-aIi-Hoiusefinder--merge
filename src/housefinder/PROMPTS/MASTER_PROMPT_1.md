# MASTER PROMPT 1 — IDEE → KOMPLETTES PROJEKT

> Verwende diesen Prompt am Anfang eines neuen Projekts, um alle Artefakte zu generieren.

---

```text
**Rolle:** Senior Software Architect, Product Owner, Tech Lead, QA Lead, DevOps Lead.

**Kontext:** Ich beschreibe eine Idee. Du machst daraus ein baubares Projekt mit allen nötigen Artefakten.

## Harte Regeln (PFLICHT)

1) **Nichts raten.** Wenn Infos fehlen: **STOPP** und stelle max. **7** gezielte Fragen.
2) Keine Fachwörter ohne kurze Erklärung.
3) **Kein Code**, bevor die offenen Fragen beantwortet sind.
4) Du arbeitest **artefakt-orientiert**: Dateien/Specs/Listen statt Gelaber.
5) Frontend ↔ Backend ↔ DB nur über klare **Contracts**.
6) **Production-Ready von Anfang an**: Rate Limiting, Validation, Error Handling, Swagger.

## Output (Pflicht-Artefakte)

Erstelle in **einer Antwort** (als Markdown-Datei-Inhalte, sauber getrennt):

1) `PROJECT_STATE.md` - Single Source of Truth
2) `CONTRACTS/api_contract.md` - API Endpoints
3) `CONTRACTS/data_contract.md` - DB Schema
4) `capabilities.yml` - Features mit Test-Anforderungen
5) `docs/PROJECT_BRIEF.md` - Projekt-Übersicht
6) `docs/ARCHITECTURE.md` - System-Architektur
7) `docs/TEST_PLAN.md` - Testplan
8) `ops/DECISIONS.md` - Tech-Entscheidungen (erste Einträge)

## Ablauf

### A) Verständnis
- 5 Zeilen: so verstehst du meine Idee
- Offene Fragen (max 7) → **warte auf Antwort**

### B) Danach erst: Artefakte erzeugen
- Fülle alle Dateien oben.
- Kurz, aber vollständig.
- Production-ready (Rate Limiting, Validation, etc. einplanen)

## Meine Idee

- **Produkt:** [Was wird gebaut?]
- **Zielgruppe:** [Für wen?]
- **Top-Funktionen:** [Was soll es können?]
- **Inputs:** [Was kommt rein?]
- **Outputs:** [Was kommt raus?]
- **Plattform:** [Web/Mobile/API/CLI?]
- **MVP zuerst:** [Minimum Viable Product]
- **Später:** [Phase 2 Features]

[HIER DEINE IDEE BESCHREIBEN]
```

---

## Nach der Antwort

1. Artefakte in die entsprechenden Dateien kopieren
2. MASTER_PROMPT_2.md für die Implementierung verwenden
3. MASTER_RUNBOOK.md Step für Step abarbeiten
