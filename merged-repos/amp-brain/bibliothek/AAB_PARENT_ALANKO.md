# AAB Build-Anleitung: Parent & Alanko

**Stand:** 2025-12-18

---

## Schnell-Referenz

| App        | Package ID                         | Keystore                 | Alias    |
| ---------- | ---------------------------------- | ------------------------ | -------- |
| **Alanko** | `com.alanko.ai`                    | `alanko-release-key.jks` | `alanko` |
| **Parent** | `com.kidsai.parent.kids_ai_parent` | `parent-release-key.jks` | `parent` |

---

## 1. Voraussetzungen

- Flutter SDK installiert
- Java JDK 17+
- Android SDK
- Keystore-Datei vorhanden

---

## 2. Keystore erstellen (falls nicht vorhanden)

### Alanko:

```bash
cd ~/activi-dev-repos/kids-ai-all-in/apps/alanko/android
keytool -genkey -v -keystore alanko-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias alanko
mv alanko-release-key.jks app/
```

### Parent:

```bash
cd ~/activi-dev-repos/kids-ai-all-in/apps/parent/android
keytool -genkey -v -keystore parent-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias parent
mv parent-release-key.jks app/
```

---

## 3. key.properties erstellen

### Alanko (`apps/alanko/android/key.properties`):

```properties
storePassword=DEIN_PASSWORT
keyPassword=DEIN_PASSWORT
keyAlias=alanko
storeFile=app/alanko-release-key.jks
```

### Parent (`apps/parent/android/key.properties`):

```properties
storePassword=DEIN_PASSWORT
keyPassword=DEIN_PASSWORT
keyAlias=parent
storeFile=app/parent-release-key.jks
```

---

## 4. AAB erstellen

### Alanko:

```bash
cd ~/activi-dev-repos/kids-ai-all-in/apps/alanko
flutter clean
flutter pub get
flutter build appbundle --release
```

**Output:** `build/app/outputs/bundle/release/app-release.aab`

### Parent:

```bash
cd ~/activi-dev-repos/kids-ai-all-in/apps/parent
flutter clean
flutter pub get
flutter build appbundle --release
```

**Output:** `build/app/outputs/bundle/release/app-release.aab`

---

## 5. Play Store Upload

1. [Google Play Console](https://play.google.com/console) oeffnen
2. App waehlen
3. Release > Production > Create new release
4. AAB-Datei hochladen
5. Release-Notizen ausfuellen
6. Veroeffentlichen

---

## Troubleshooting

### "Keystore file not found"

```bash
# Pruefen ob Keystore existiert
ls -la apps/alanko/android/app/*.jks
ls -la apps/parent/android/app/*.jks
```

### "Wrong password"

- Passwoerter in `key.properties` pruefen

### Build schlaegt fehl

```bash
flutter clean
flutter pub get
flutter build appbundle --release
```

### Gradle Cache Fehler

```bash
cd android
./gradlew --stop
rm -rf ~/.gradle/caches/8.14
cd ..
flutter clean
flutter pub get
flutter build appbundle --release
```

---

## Parent Keystore-Problem

**WICHTIG:** Parent App hat Keystore-Problem!

### Erwarteter SHA1 (Play Store):

```
8B:D6:C9:61:7D:6D:A6:28:15:73:89:4D:8D:76:51:3A:3D:0D:46:E2
```

### Keystore pruefen:

```bash
keytool -list -v -keystore [KEYSTORE_PFAD] | grep SHA1
```

### Alle Keystores finden:

```bash
find ~ -name "*.jks" -o -name "*.keystore" 2>/dev/null
```

### Loesung:

1. Urspruenglichen Keystore mit richtigem SHA1 finden
2. `key.properties` mit diesem Keystore erstellen
3. AAB neu bauen

---

## Quick Commands

### Alanko AAB bauen:

```bash
cd ~/activi-dev-repos/kids-ai-all-in/apps/alanko && flutter clean && flutter pub get && flutter build appbundle --release
```

### Parent AAB bauen:

```bash
cd ~/activi-dev-repos/kids-ai-all-in/apps/parent && flutter clean && flutter pub get && flutter build appbundle --release
```

### Keystore SHA1 pruefen:

```bash
keytool -list -v -keystore apps/alanko/android/app/alanko-release-key.jks | grep SHA1
keytool -list -v -keystore apps/parent/android/app/parent-release-key.jks | grep SHA1
```

---

## Wichtige Hinweise

1. **Keystore NIEMALS verlieren** - Ohne Keystore keine Updates moeglich
2. **key.properties NICHT committen** - In .gitignore
3. **versionCode erhoehen** bei jedem Release in `pubspec.yaml`
4. **Testen** vor Upload auf echtem Geraet
