# KB Tagging Rules

## Pflicht-Metadaten pro Doc
- vendor, topic, doc_type, last_verified, tags

## Tags (konservativ)
- official: nur offizielle Vendor-Quelle oder 1:1 Zusammenfassung mit Link
- internal: interne Notiz/Entscheidung
- integration_note: "Known good config" / Implementierung
- experiment: Tests/Benchmarks

## Konfliktregel
Wenn 2 Quellen widersprechen:
1) Neuere Quelle bevorzugen (last_verified)
2) Sonst: OPEN_QUESTIONS Eintrag erstellen + markieren "needs verification"
