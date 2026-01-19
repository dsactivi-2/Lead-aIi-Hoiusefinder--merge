# OpenRouter Multi-Model Integration

## Setup

1. Erstelle einen Account auf https://openrouter.ai
2. Generiere einen API-Key
3. Speichere den Key in `.env` (NICHT committen!)

```bash
# .env Datei erstellen (lokal, nicht in Git)
echo "OPENROUTER_API_KEY=sk-or-..." > .env
```

## Verfügbare Modelle

| Modell      | ID                          | Kosten (1M Tokens) | Stärke           |
| ----------- | --------------------------- | ------------------ | ---------------- |
| DeepSeek R1 | deepseek/deepseek-r1        | ~$0.55             | Logik, Mathe     |
| GPT-4o      | openai/gpt-4o               | ~$5.00             | Allrounder       |
| Claude 3.5  | anthropic/claude-3.5-sonnet | ~$3.00             | Code, Writing    |
| Grok        | x-ai/grok-beta              | ~$5.00             | Aktuell, Twitter |

## Verwendung durch Amp

```python
import requests

def ask_model(model_id, question):
    response = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json"
        },
        json={
            "model": model_id,
            "messages": [{"role": "user", "content": question}]
        }
    )
    return response.json()["choices"][0]["message"]["content"]

# Beispiel: DeepSeek für Mathe-Problem
answer = ask_model("deepseek/deepseek-r1", "Berechne die optimale Datenbankstruktur für...")
```

## Wann welches Modell?

| Aufgabe                    | Modell                          |
| -------------------------- | ------------------------------- |
| Mathematik/Logik           | DeepSeek R1                     |
| Architektur-Entscheidungen | GPT-4o                          |
| Code-Review                | Claude 3.5                      |
| Aktuelle Trends/News       | Grok                            |
| Standard-Coding            | Amp (Claude 4) - kein API nötig |

## Kosten-Tracking

Jede Anfrage wird geloggt in `usage_log.json`:

```json
{
  "date": "2024-12-12",
  "model": "deepseek/deepseek-r1",
  "tokens_in": 500,
  "tokens_out": 1200,
  "cost_usd": 0.001
}
```
