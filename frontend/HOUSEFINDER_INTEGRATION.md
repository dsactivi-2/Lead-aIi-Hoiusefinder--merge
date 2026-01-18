# Housefinder Integration in Lead-AI2

## Übersicht

Diese Datei dokumentiert welche Housefinder-Komponenten in Lead-AI2 integriert werden können.

---

## Sofort verwendbare Module

### 1. AI Response Analyzer

**Original:** `Housefinder/src/ai/response_analyzer.py`

**Funktion:** Analysiert Vermieter-Antworten mit GPT-4 und extrahiert strukturierte Daten.

**Integration:**
```javascript
// backend/src/services/responseAnalyzer.js

const OpenAI = require('openai');

const SYSTEM_PROMPT = `Du bist ein Assistent, der Antworten von Vermietern analysiert.
Extrahiere alle relevanten Informationen und gib sie im folgenden JSON-Format zurück:

{
  "verfuegbar": "Ja/Nein/Unklar",
  "preis_monat": "Betrag in EUR oder leer",
  "kaution": "Betrag oder leer",
  "frei_ab": "Datum oder leer",
  "adresse": "Adresse oder leer",
  "kontaktperson": "Name oder leer",
  "telefon": "Telefonnummer oder leer",
  "internet": "Ja/Nein/Unklar",
  "parkplatz": "Ja/Nein/Unklar",
  "bemerkung": "Zusätzliche Informationen"
}`;

async function analyzeResponse(responseText) {
  const openai = new OpenAI();

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `Analysiere: ${responseText}` }
    ],
    response_format: { type: "json_object" }
  });

  return JSON.parse(response.choices[0].message.content);
}

module.exports = { analyzeResponse };
```

### 2. Recommendation Engine

**Original:** `Housefinder/src/ai/recommendation_engine.py`

**Funktion:** Bewertet und rankt Wohnungsoptionen nach Distanz, Preis, Ausstattung.

**Integration:**
```javascript
// backend/src/services/recommendationEngine.js

function calculateHousingScore(housing, candidate) {
  let score = 100;

  // Distanz-Score (näher = besser)
  const distance = housing.distance_km || 999;
  if (distance <= 10) score += 30;
  else if (distance <= 20) score += 20;
  else if (distance <= 30) score += 10;
  else score -= 10;

  // Preis-Score (innerhalb Budget = besser)
  const price = housing.price_monthly || 0;
  const budget = candidate.budget_max || 1500;

  if (price > 0 && price <= budget * 0.8) score += 20;
  else if (price <= budget) score += 10;
  else if (price > budget) score -= 20;

  // Ausstattung
  if (housing.has_internet) score += 5;
  if (housing.has_parking) score += 5;
  if (housing.mietvertrag_possible) score += 10;
  if (housing.anmeldung_possible) score += 10;

  return Math.max(0, Math.min(100, score));
}

function generateWarnings(housing, candidate) {
  const warnings = [];

  if (housing.distance_km > 30) {
    warnings.push(`Zu weit: ${housing.distance_km}km`);
  }

  if (housing.price_monthly > candidate.budget_max) {
    warnings.push(`Über Budget: €${housing.price_monthly} > €${candidate.budget_max}`);
  }

  if (!housing.mietvertrag_possible && candidate.needs_mietvertrag) {
    warnings.push('Kein Mietvertrag möglich');
  }

  if (!housing.anmeldung_possible && candidate.needs_anmeldung) {
    warnings.push('Keine Anmeldung möglich');
  }

  return warnings;
}

function rankHousing(housingList, candidate) {
  return housingList
    .map(h => ({
      ...h,
      score: calculateHousingScore(h, candidate),
      warnings: generateWarnings(h, candidate)
    }))
    .sort((a, b) => b.score - a.score)
    .map((h, index) => ({ ...h, rank: index + 1 }));
}

module.exports = { calculateHousingScore, generateWarnings, rankHousing };
```

### 3. Email Templates

**Original:** `Housefinder/src/communication/templates.py`

**Integration:**
```javascript
// backend/src/services/emailTemplates.js

const templates = {
  inquiry: {
    subject: (candidate) =>
      candidate.urgent
        ? `DRINGEND: Unterkunftsanfrage für ${candidate.name}`
        : `Unterkunftsanfrage für ${candidate.name}`,

    body: (candidate, housing) => `
Sehr geehrte Damen und Herren,

wir suchen eine Unterkunft für unseren Mitarbeiter.

=== MITARBEITER ===
Name: ${candidate.name}
Arbeitgeber: ${candidate.employer}
Arbeitsbeginn: ${candidate.job_start_date}
Arbeitsort: ${candidate.job_location}

=== ANFORDERUNGEN ===
Gewünschter Einzug: ${candidate.move_in_date}
Budget: max. ${candidate.budget_max} EUR/Monat
Personen: ${candidate.family_size}
${candidate.needs_mietvertrag ? '✓ Mietvertrag benötigt' : ''}
${candidate.needs_anmeldung ? '✓ Anmeldung benötigt' : ''}

=== UNTERKUNFT ===
${housing.title}
${housing.address}, ${housing.city}
Preis: ${housing.price_monthly} EUR/Monat

Ist diese Unterkunft noch verfügbar?

Mit freundlichen Grüßen,
Step2Job Housing Team
housing@step2job.com
    `.trim()
  },

  followup: {
    subject: (candidate) =>
      `Nachfrage: Unterkunftsanfrage für ${candidate.name}`,

    body: (candidate) => `
Sehr geehrte Damen und Herren,

ich möchte höflich nachfragen, ob Sie unsere Anfrage vom
letzten Mal erhalten haben.

Wir suchen weiterhin eine Unterkunft für ${candidate.name}.

Über eine kurze Rückmeldung würden wir uns sehr freuen.

Mit freundlichen Grüßen,
Step2Job Housing Team
    `.trim()
  }
};

module.exports = templates;
```

### 4. Quick Availability Check

**Original:** `Housefinder/src/ai/response_analyzer.py` - `quick_check_availability()`

**Integration:**
```javascript
// backend/src/services/responseAnalyzer.js

function quickCheckAvailability(responseText) {
  const textLower = responseText.toLowerCase();

  const negativeKeywords = [
    'nicht verfügbar', 'ausgebucht', 'belegt', 'leider nicht',
    'nein', 'no', 'sorry', 'vermietet', 'besetzt'
  ];

  const positiveKeywords = [
    'verfügbar', 'available', 'frei', 'interessiert',
    'ja', 'yes', 'gerne', 'können', 'möglich'
  ];

  // Negative zuerst prüfen
  if (negativeKeywords.some(kw => textLower.includes(kw))) {
    return { available: false, confidence: 0.9 };
  }

  // Positive prüfen
  if (positiveKeywords.some(kw => textLower.includes(kw))) {
    return { available: true, confidence: 0.8 };
  }

  // Unklar
  return { available: null, confidence: 0.3 };
}

module.exports = { quickCheckAvailability };
```

---

## Neue Backend-Endpoints (mit Housefinder-Logik)

### POST /v1/agents/analyze-response

```javascript
// backend/src/index.js

app.post('/v1/agents/analyze-response', async (req, res) => {
  const { response_text, candidate_id, communication_id } = req.body;

  if (!response_text) {
    return res.status(400).json({ error: 'response_text required' });
  }

  // Quick check first
  const quickResult = quickCheckAvailability(response_text);

  // Full AI analysis
  const analysis = await analyzeResponse(response_text);

  // Save to database
  const analysisId = `ana_${uuidv4().slice(0, 8)}`;
  db.prepare(`
    INSERT INTO analyses (id, communication_id, lead_id, analysis_type, result, confidence, sentiment)
    VALUES (?, ?, ?, 'landlord_response', ?, ?, ?)
  `).run(
    analysisId,
    communication_id,
    candidate_id,
    JSON.stringify(analysis),
    quickResult.confidence,
    quickResult.available ? 'positive' : 'negative'
  );

  res.json({
    analysis_id: analysisId,
    quick_check: quickResult,
    full_analysis: analysis
  });
});
```

### POST /v1/agents/search-housing

```javascript
app.post('/v1/agents/search-housing', async (req, res) => {
  const { candidate_id, auto_negotiate } = req.body;

  const candidate = db.prepare('SELECT * FROM candidates WHERE id = ?').get(candidate_id);
  if (!candidate) {
    return res.status(404).json({ error: 'Candidate not found' });
  }

  // Get all housing in candidate's preferred city
  const housing = db.prepare(`
    SELECT * FROM housing
    WHERE city = ? AND is_available = 1
    ORDER BY price_monthly ASC
  `).all(candidate.preferred_city);

  // Rank using Housefinder algorithm
  const rankedHousing = rankHousing(housing, candidate);

  // Get top 3
  const top3 = rankedHousing.slice(0, 3);

  // Auto-create negotiations if requested
  if (auto_negotiate && top3.length > 0) {
    for (const h of top3) {
      const negId = `neg_${uuidv4().slice(0, 8)}`;
      db.prepare(`
        INSERT INTO negotiations (id, candidate_id, housing_id, vermieter_id, status, offered_price)
        VALUES (?, ?, ?, ?, 'pending', ?)
      `).run(negId, candidate_id, h.id, h.vermieter_id, h.price_monthly);
    }
  }

  res.json({
    success: true,
    candidate_id,
    matched_count: rankedHousing.length,
    top_3: top3,
    all_matches: rankedHousing
  });
});
```

---

## Zusammenfassung: Was übernehmen?

| Housefinder Modul | Übernehmen? | Aufwand |
|-------------------|-------------|---------|
| ResponseAnalyzer | ✅ JA | 2h (Port zu JS) |
| RecommendationEngine | ✅ JA | 2h (Port zu JS) |
| Email Templates | ✅ JA | 1h (Copy) |
| QuickAvailabilityCheck | ✅ JA | 30min (Port) |
| Scrapers | ⚠️ OPTIONAL | 1-2 Tage |
| WhatsApp Sender | ⚠️ OPTIONAL | 4h |
| Google Sheets Integration | ❌ NEIN | Nicht benötigt |

### Empfehlung

1. **Sofort integrieren:** ResponseAnalyzer, RecommendationEngine, Email Templates
2. **Später:** Scrapers (wenn automatische Wohnungssuche gewünscht)
3. **Nicht benötigt:** Google Sheets (wir haben SQLite DB)

---

*Erstellt: 2026-01-15*
