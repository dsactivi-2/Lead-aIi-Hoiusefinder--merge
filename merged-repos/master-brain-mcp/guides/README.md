# User Guides / Benutzeranleitungen

> Einfache Anleitungen für Endbenutzer - keine technischen Betriebsbücher!

## Regeln

1. **Kurz & einfach** - Max. 2-3 Seiten pro Guide
2. **Mit Bildern/Skizzen** - Screenshots, Diagramme, Beispiele
3. **Für Endbenutzer** - Keine technischen Details
4. **Schritt-für-Schritt** - Nummerierte Anleitungen

## Struktur

```
guides/
├── README.md                    # Diese Datei
├── QUICK_START.md              # Erste Schritte (PFLICHT vor Deploy!)
├── feature_booking.md          # Anleitung: Buchung erstellen
├── feature_profile.md          # Anleitung: Profil bearbeiten
└── assets/                     # Bilder, Screenshots
    ├── screenshot_login.png
    └── diagram_workflow.png
```

## Pflicht vor Deploy

**Vor jedem Deploy zu main MUSS mindestens existieren:**
- `guides/QUICK_START.md` - Erste Schritte für neue Benutzer

## Vorlage

Nutze `guides/TEMPLATE_GUIDE.md` als Vorlage für neue Anleitungen.
