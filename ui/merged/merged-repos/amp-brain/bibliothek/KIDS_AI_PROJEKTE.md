# Kids-AI Projekte - Bibliothek

**Stand:** 2025-12-18

---

## 1. Therapy-AI (Sprachtherapie-App)

**Zweck:** KI-Sprachtherapie für Kinder mit Hörverlust

### Tech-Stack

| Komponente     | Technologie                |
| -------------- | -------------------------- |
| Speech-to-Text | OpenAI Whisper (on-device) |
| Text-to-Speech | ElevenLabs (Voice Cloning) |
| Framework      | Flutter + Riverpod         |
| Backend        | Firebase Firestore         |

### Kern-Services

- `WhisperSpeechService` - Spracherkennung + Aussprache-Analyse
- `ElevenLabsVoiceService` - Therapeuten-Stimme klonen
- `AdaptiveExerciseService` - Schwierigkeit anpassen
- `ProgressTrackingService` - Fortschritt speichern

### Status

- [x] App-Struktur
- [x] Whisper-Integration
- [x] ElevenLabs-Integration
- [x] Adaptive Logic
- [x] UI-Screens
- [ ] Firebase-Integration
- [ ] Testing

### Dateipfade

```
apps/therapy-ai/
├── lib/services/     # Kern-Services
├── lib/models/       # Datenmodelle
├── lib/screens/      # UI
└── lib/widgets/      # Wiederverwendbare Widgets
```

---

## 2. Callcenter-AI (Lisa Verkaufsagent)

**Zweck:** KI-Verkaufsagent für Solarmodule

### Tech-Stack

| Komponente | Technologie        |
| ---------- | ------------------ |
| KI-Backend | Gemini API         |
| Voice-In   | speech_to_text     |
| Voice-Out  | flutter_tts        |
| Framework  | Flutter + Riverpod |

### Kern-Features

- Text + Voice Chat mit KI-Agent "Lisa"
- Verkaufspsychologie-Prompt
- Deutsch als Hauptsprache

### Status

- [x] App-Struktur
- [x] Sales Agent Service
- [x] Chat-Screen
- [x] Voice-Integration
- [ ] Dashboard + Skalierung
- [ ] MCP Server + Prompt-DB

### Dateipfade

```
apps/callcenter-ai/
├── lib/services/sales_agent_service.dart
├── lib/screens/chat/sales_chat_screen.dart
├── lib/providers/
└── assets/locales/
```

---

## 3. Weitere Apps im Monorepo

| App             | Zweck                  |
| --------------- | ---------------------- |
| **alanko**      | Basis-KI-Chat-App      |
| **lianko**      | Erweiterte KI-Chat-App |
| **parent**      | Eltern-Dashboard       |
| **therapy-web** | Web-Version Therapie   |

---

## 4. Shared Package

**Pfad:** `packages/shared/`

### Enthält

- Design System (Colors, Typography)
- Wiederverwendbare Widgets
- Firebase-Konfiguration
- Lokalisierung

---

## 5. Wichtige Setup-Dokumente

| Thema      | Datei                                  |
| ---------- | -------------------------------------- |
| Keystore   | `KEYSTORE_SETUP_COMPLETE.md`           |
| Firebase   | `packages/shared/FIREBASE_SETUP.md`    |
| Play Store | `PLAYSTORE_BUILD_ANLEITUNG.md`         |
| Whisper    | `apps/therapy-ai/WHISPER_CPP_SETUP.md` |
| OpenAI API | `apps/therapy-ai/OPENAI_API_SETUP.md`  |

---

## 6. Offene TODOs

### Therapy-AI

1. Firebase-Integration abschließen
2. Unit Tests schreiben
3. Whisper-Performance optimieren

### Callcenter-AI

1. Dashboard erstellen
2. Server-Deployment für Skalierung
3. Knowledge Base auf Server
4. MCP Server für KI
5. Prompt-Datenbank

---

## Quick Commands

```bash
# Therapy-AI bauen
cd ~/activi-dev-repos/kids-ai-all-in/apps/therapy-ai
flutter build appbundle

# Callcenter-AI bauen
cd ~/activi-dev-repos/kids-ai-all-in/apps/callcenter-ai
flutter build appbundle

# Alle Tests
flutter test
```
