const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'lead-builder.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

// ============================================================================
// DATABASE SCHEMA - Extended for ATU Relocation / Monteurzimmer
// ============================================================================

db.exec(`
  -- ========== CORE TABLES (existing) ==========

  CREATE TABLE IF NOT EXISTS drafts (
    id TEXT PRIMARY KEY,
    input_text TEXT NOT NULL,
    output_target TEXT NOT NULL,
    reuse_mode TEXT NOT NULL,
    understanding TEXT,
    proposed_intent_spec TEXT,
    status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT (datetime('now')),
    confirmed_at TEXT
  );

  CREATE TABLE IF NOT EXISTS templates (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    title TEXT NOT NULL UNIQUE,
    tags TEXT DEFAULT '[]',
    content TEXT NOT NULL,
    usage_count INTEGER DEFAULT 0,
    last_used_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    version INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS artifacts (
    id TEXT PRIMARY KEY,
    draft_id TEXT,
    type TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (draft_id) REFERENCES drafts(id)
  );

  -- ========== CAMPAIGN MANAGEMENT ==========

  CREATE TABLE IF NOT EXISTS campaigns (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    target_type TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    priority TEXT DEFAULT 'normal',
    search_criteria TEXT,
    target_count INTEGER DEFAULT 100,
    current_count INTEGER DEFAULT 0,
    start_date TEXT,
    end_date TEXT,
    last_run_at TEXT,
    next_run_at TEXT,
    run_interval_hours INTEGER DEFAULT 24,
    total_leads_found INTEGER DEFAULT 0,
    total_contacted INTEGER DEFAULT 0,
    total_responses INTEGER DEFAULT 0,
    total_conversions INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY,
    campaign_id TEXT,
    source TEXT NOT NULL,
    source_platform TEXT,
    source_url TEXT,
    name TEXT,
    company TEXT,
    position TEXT,
    email TEXT,
    phone TEXT,
    location TEXT,
    score REAL DEFAULT 0,
    status TEXT DEFAULT 'new',
    quality TEXT DEFAULT 'unknown',
    raw_data TEXT,
    enriched_data TEXT,
    notes TEXT,
    tags TEXT DEFAULT '[]',
    signature TEXT,
    is_duplicate INTEGER DEFAULT 0,
    duplicate_of TEXT,
    contacted_at TEXT,
    responded_at TEXT,
    converted_at TEXT,
    last_activity_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
  );

  CREATE TABLE IF NOT EXISTS communications (
    id TEXT PRIMARY KEY,
    lead_id TEXT,
    campaign_id TEXT,
    channel TEXT NOT NULL,
    direction TEXT NOT NULL,
    type TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    template_id TEXT,
    status TEXT DEFAULT 'pending',
    error_message TEXT,
    sent_at TEXT,
    delivered_at TEXT,
    read_at TEXT,
    responded_at TEXT,
    external_id TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (lead_id) REFERENCES leads(id),
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
    FOREIGN KEY (template_id) REFERENCES templates(id)
  );

  CREATE TABLE IF NOT EXISTS analyses (
    id TEXT PRIMARY KEY,
    communication_id TEXT,
    lead_id TEXT,
    analysis_type TEXT NOT NULL,
    result TEXT NOT NULL,
    confidence REAL DEFAULT 0,
    extracted_intent TEXT,
    extracted_entities TEXT,
    sentiment TEXT,
    recommended_action TEXT,
    warnings TEXT,
    model_used TEXT DEFAULT 'gpt-4',
    tokens_used INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (communication_id) REFERENCES communications(id),
    FOREIGN KEY (lead_id) REFERENCES leads(id)
  );

  CREATE TABLE IF NOT EXISTS sources (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL,
    platform TEXT,
    config TEXT,
    is_active INTEGER DEFAULT 1,
    total_leads INTEGER DEFAULT 0,
    success_rate REAL DEFAULT 0,
    last_run_at TEXT,
    last_error TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS scheduled_tasks (
    id TEXT PRIMARY KEY,
    task_type TEXT NOT NULL,
    reference_id TEXT,
    reference_type TEXT,
    scheduled_at TEXT NOT NULL,
    executed_at TEXT,
    status TEXT DEFAULT 'pending',
    payload TEXT,
    result TEXT,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    campaign_id TEXT,
    report_type TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    format TEXT DEFAULT 'json',
    period_start TEXT,
    period_end TEXT,
    metrics TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
  );

  -- ============================================================================
  -- NEW: VERMIETER (Landlords) - für Monteurzimmer
  -- ============================================================================

  CREATE TABLE IF NOT EXISTS vermieter (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    company TEXT,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    city TEXT DEFAULT 'München',
    postal_code TEXT,

    -- Bewertung
    rating REAL DEFAULT 0,
    total_deals INTEGER DEFAULT 0,
    success_rate REAL DEFAULT 0,

    -- Status
    status TEXT DEFAULT 'active', -- 'active', 'inactive', 'blacklisted'
    preferred_contact TEXT DEFAULT 'phone', -- 'phone', 'email', 'whatsapp'
    languages TEXT DEFAULT '["de"]', -- JSON array

    -- Notizen
    notes TEXT,
    tags TEXT DEFAULT '[]',

    -- Tracking
    last_contacted_at TEXT,
    last_deal_at TEXT,

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  -- ============================================================================
  -- NEW: HOUSING (Wohnungen/Monteurzimmer)
  -- ============================================================================

  CREATE TABLE IF NOT EXISTS housing (
    id TEXT PRIMARY KEY,
    vermieter_id TEXT NOT NULL,

    -- Details
    title TEXT NOT NULL,
    type TEXT NOT NULL, -- 'monteurzimmer', 'apartment', 'wg', 'house'
    address TEXT,
    city TEXT DEFAULT 'München',
    postal_code TEXT,
    district TEXT, -- Stadtteil

    -- Eigenschaften
    size_sqm REAL,
    rooms INTEGER DEFAULT 1,
    max_persons INTEGER DEFAULT 1,

    -- Preise
    price_monthly REAL NOT NULL,
    price_weekly REAL,
    price_daily REAL,
    deposit REAL,
    utilities_included INTEGER DEFAULT 0, -- Nebenkosten inklusive

    -- Verfügbarkeit
    available_from TEXT,
    available_until TEXT,
    min_stay_days INTEGER DEFAULT 30,
    max_stay_days INTEGER,
    is_available INTEGER DEFAULT 1,

    -- Ausstattung
    amenities TEXT DEFAULT '[]', -- JSON: ["wifi", "kitchen", "parking", "washing"]
    furniture TEXT DEFAULT 'furnished', -- 'furnished', 'partially', 'unfurnished'

    -- Für Migranten wichtig
    mietvertrag_possible INTEGER DEFAULT 1, -- Mietvertrag möglich
    anmeldung_possible INTEGER DEFAULT 1, -- Anmeldung möglich

    -- Medien
    images TEXT DEFAULT '[]', -- JSON array of URLs
    source_url TEXT,

    -- Status
    status TEXT DEFAULT 'active', -- 'active', 'reserved', 'rented', 'inactive'

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),

    FOREIGN KEY (vermieter_id) REFERENCES vermieter(id)
  );

  -- ============================================================================
  -- NEW: CANDIDATES (ATU Fachkräfte aus Bosnien)
  -- ============================================================================

  CREATE TABLE IF NOT EXISTS candidates (
    id TEXT PRIMARY KEY,

    -- Persönliche Daten
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    nationality TEXT DEFAULT 'BA', -- ISO Country Code
    language_skills TEXT DEFAULT '["de", "bs"]', -- JSON array

    -- Job bei ATU
    employer TEXT DEFAULT 'ATU',
    job_position TEXT,
    job_location TEXT DEFAULT 'München',
    job_start_date TEXT,

    -- Ankunft
    arrival_date TEXT,
    current_location TEXT, -- Wo ist der Kandidat jetzt

    -- Wohnungsbedarf
    preferred_city TEXT DEFAULT 'München',
    preferred_districts TEXT DEFAULT '[]', -- JSON array
    budget_max REAL DEFAULT 800,
    family_size INTEGER DEFAULT 1,
    needs_mietvertrag INTEGER DEFAULT 1,
    needs_anmeldung INTEGER DEFAULT 1,
    move_in_date TEXT,

    -- Status
    status TEXT DEFAULT 'searching', -- 'searching', 'negotiating', 'found', 'moved_in'
    assigned_housing_id TEXT,

    -- Notizen
    notes TEXT,
    special_requirements TEXT,

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),

    FOREIGN KEY (assigned_housing_id) REFERENCES housing(id)
  );

  -- ============================================================================
  -- NEW: RELOCATION_REQUESTS (Wohnungssuche-Aufträge)
  -- ============================================================================

  CREATE TABLE IF NOT EXISTS relocation_requests (
    id TEXT PRIMARY KEY,
    candidate_id TEXT NOT NULL,
    campaign_id TEXT, -- Optional: Kampagne für Lead-Generierung

    -- Anforderungen
    requirements TEXT NOT NULL, -- JSON mit allen Anforderungen

    -- Status
    status TEXT DEFAULT 'pending', -- 'pending', 'searching', 'negotiating', 'found', 'completed', 'cancelled'
    priority TEXT DEFAULT 'normal',

    -- Ergebnis
    matched_housing TEXT DEFAULT '[]', -- JSON array of housing IDs
    final_housing_id TEXT,

    -- Agent Tracking
    assigned_agent TEXT, -- 'lead_ai', 'relocation_agent'
    current_step TEXT,

    -- Zeitstempel
    started_at TEXT,
    completed_at TEXT,

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),

    FOREIGN KEY (candidate_id) REFERENCES candidates(id),
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
    FOREIGN KEY (final_housing_id) REFERENCES housing(id)
  );

  -- ============================================================================
  -- NEW: NEGOTIATIONS (Verhandlungen mit Vermietern)
  -- ============================================================================

  CREATE TABLE IF NOT EXISTS negotiations (
    id TEXT PRIMARY KEY,
    relocation_request_id TEXT,
    candidate_id TEXT NOT NULL,
    vermieter_id TEXT NOT NULL,
    housing_id TEXT NOT NULL,

    -- Status
    status TEXT DEFAULT 'pending', -- 'pending', 'calling', 'in_progress', 'accepted', 'rejected', 'cancelled'

    -- Verhandlungsdetails
    offered_price REAL,
    final_price REAL,
    move_in_date TEXT,
    contract_duration_months INTEGER,

    -- Kommunikation
    call_attempts INTEGER DEFAULT 0,
    last_call_at TEXT,
    call_transcript TEXT, -- JSON array of call logs

    -- Ergebnis
    rejection_reason TEXT,
    notes TEXT,

    -- Agent
    handled_by TEXT DEFAULT 'relocation_agent',

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),

    FOREIGN KEY (relocation_request_id) REFERENCES relocation_requests(id),
    FOREIGN KEY (candidate_id) REFERENCES candidates(id),
    FOREIGN KEY (vermieter_id) REFERENCES vermieter(id),
    FOREIGN KEY (housing_id) REFERENCES housing(id)
  );

  -- ============================================================================
  -- NEW: DEALS (Abgeschlossene Verträge)
  -- ============================================================================

  CREATE TABLE IF NOT EXISTS deals (
    id TEXT PRIMARY KEY,
    negotiation_id TEXT NOT NULL,
    candidate_id TEXT NOT NULL,
    vermieter_id TEXT NOT NULL,
    housing_id TEXT NOT NULL,

    -- Vertragsdetails
    monthly_rent REAL NOT NULL,
    deposit REAL,
    move_in_date TEXT NOT NULL,
    contract_start TEXT NOT NULL,
    contract_end TEXT,

    -- Status
    status TEXT DEFAULT 'pending', -- 'pending', 'signed', 'active', 'completed', 'cancelled'

    -- Dokumente
    contract_signed INTEGER DEFAULT 0,
    deposit_paid INTEGER DEFAULT 0,
    keys_handed_over INTEGER DEFAULT 0,
    anmeldung_done INTEGER DEFAULT 0,

    -- Tracking
    signed_at TEXT,
    moved_in_at TEXT,

    notes TEXT,

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),

    FOREIGN KEY (negotiation_id) REFERENCES negotiations(id),
    FOREIGN KEY (candidate_id) REFERENCES candidates(id),
    FOREIGN KEY (vermieter_id) REFERENCES vermieter(id),
    FOREIGN KEY (housing_id) REFERENCES housing(id)
  );

  -- ============================================================================
  -- INDEXES
  -- ============================================================================

  CREATE INDEX IF NOT EXISTS idx_templates_type ON templates(type);
  CREATE INDEX IF NOT EXISTS idx_templates_title ON templates(title);
  CREATE INDEX IF NOT EXISTS idx_drafts_status ON drafts(status);
  CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
  CREATE INDEX IF NOT EXISTS idx_campaigns_priority ON campaigns(priority);
  CREATE INDEX IF NOT EXISTS idx_leads_campaign ON leads(campaign_id);
  CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
  CREATE INDEX IF NOT EXISTS idx_leads_score ON leads(score);
  CREATE INDEX IF NOT EXISTS idx_leads_signature ON leads(signature);
  CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
  CREATE INDEX IF NOT EXISTS idx_communications_lead ON communications(lead_id);
  CREATE INDEX IF NOT EXISTS idx_communications_status ON communications(status);
  CREATE INDEX IF NOT EXISTS idx_communications_channel ON communications(channel);
  CREATE INDEX IF NOT EXISTS idx_analyses_lead ON analyses(lead_id);
  CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_status ON scheduled_tasks(status);
  CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_scheduled ON scheduled_tasks(scheduled_at);

  -- New indexes
  CREATE INDEX IF NOT EXISTS idx_vermieter_city ON vermieter(city);
  CREATE INDEX IF NOT EXISTS idx_vermieter_status ON vermieter(status);
  CREATE INDEX IF NOT EXISTS idx_housing_city ON housing(city);
  CREATE INDEX IF NOT EXISTS idx_housing_price ON housing(price_monthly);
  CREATE INDEX IF NOT EXISTS idx_housing_available ON housing(is_available);
  CREATE INDEX IF NOT EXISTS idx_housing_vermieter ON housing(vermieter_id);
  CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidates(status);
  CREATE INDEX IF NOT EXISTS idx_relocation_status ON relocation_requests(status);
  CREATE INDEX IF NOT EXISTS idx_negotiations_status ON negotiations(status);
  CREATE INDEX IF NOT EXISTS idx_deals_status ON deals(status);
`);

// ============================================================================
// SEED DATA
// ============================================================================

// Templates
const templateCount = db.prepare('SELECT COUNT(*) as count FROM templates').get();
if (templateCount.count === 0) {
  const insert = db.prepare(`
    INSERT INTO templates (id, type, title, tags, content, usage_count, last_used_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
  `);

  insert.run('tpl_10', 'lead_campaign_json', 'SHK Westbalkan DE', JSON.stringify(['SHK', 'DE', 'Westbalkan']),
    JSON.stringify({ type: 'lead_campaign', name: 'SHK Westbalkan DE', search_spec: { limit: 200, region: 'DE' } }), 12);

  insert.run('tpl_11', 'call_prompt', 'Call Script – Erstkontakt Firma', JSON.stringify(['Sales', 'Erstkontakt']),
    JSON.stringify({ script: 'Guten Tag, mein Name ist [NAME] von [FIRMA]. Ich rufe an wegen...' }), 8);

  insert.run('tpl_12', 'lead_campaign_json', 'Monteurzimmer München', JSON.stringify(['Monteurzimmer', 'München', 'Housing']),
    JSON.stringify({ type: 'housing_search', name: 'Monteurzimmer München', search_spec: { city: 'München', type: 'monteurzimmer' } }), 0);

  insert.run('tpl_13', 'call_prompt', 'Vermieter Erstkontakt', JSON.stringify(['Vermieter', 'Housing']),
    JSON.stringify({ script: 'Guten Tag, mein Name ist Anna von ATU Relocation. Wir suchen Monteurzimmer für Fachkräfte...' }), 0);

  console.log('[DB] Seed templates inserted');
}

// Sources
const sourceCount = db.prepare('SELECT COUNT(*) as count FROM sources').get();
if (sourceCount.count === 0) {
  const insertSource = db.prepare(`
    INSERT INTO sources (id, name, type, platform, config, is_active)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertSource.run('src_linkedin', 'LinkedIn', 'scraper', 'linkedin', JSON.stringify({ rate_limit: 100 }), 1);
  insertSource.run('src_xing', 'XING', 'scraper', 'xing', JSON.stringify({ rate_limit: 50 }), 1);
  insertSource.run('src_monteurzimmer', 'mein-Monteurzimmer.de', 'scraper', 'monteurzimmer',
    JSON.stringify({ base_url: 'https://www.mein-monteurzimmer.de', city: 'München' }), 1);
  insertSource.run('src_wggesucht', 'WG-Gesucht', 'scraper', 'wggesucht',
    JSON.stringify({ base_url: 'https://www.wg-gesucht.de', city: 'München' }), 1);
  insertSource.run('src_immoscout', 'ImmoScout24', 'scraper', 'immoscout',
    JSON.stringify({ base_url: 'https://www.immobilienscout24.de', city: 'München' }), 1);
  insertSource.run('src_manual', 'Manual Entry', 'manual', 'custom', JSON.stringify({}), 1);

  console.log('[DB] Seed sources inserted');
}

// Sample Vermieter for München
const vermieterCount = db.prepare('SELECT COUNT(*) as count FROM vermieter').get();
if (vermieterCount.count === 0) {
  const insertVermieter = db.prepare(`
    INSERT INTO vermieter (id, name, company, phone, email, address, city, postal_code, status, languages)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertVermieter.run('verm_001', 'Hans Müller', 'Müller Immobilien', '+49 89 1234567', 'mueller@example.de',
    'Leopoldstraße 42', 'München', '80802', 'active', '["de"]');
  insertVermieter.run('verm_002', 'Maria Schmidt', 'Schmidt Wohnen GmbH', '+49 89 7654321', 'schmidt@example.de',
    'Sendlinger Str. 15', 'München', '80331', 'active', '["de", "en"]');
  insertVermieter.run('verm_003', 'Thomas Bauer', null, '+49 89 9876543', 'bauer@example.de',
    'Schwabing', 'München', '80799', 'active', '["de"]');

  console.log('[DB] Seed vermieter inserted');
}

// Sample Housing
const housingCount = db.prepare('SELECT COUNT(*) as count FROM housing').get();
if (housingCount.count === 0) {
  const insertHousing = db.prepare(`
    INSERT INTO housing (id, vermieter_id, title, type, address, city, postal_code, district,
      size_sqm, rooms, max_persons, price_monthly, deposit, utilities_included,
      available_from, min_stay_days, amenities, mietvertrag_possible, anmeldung_possible, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertHousing.run('hous_001', 'verm_001', 'Monteurzimmer Schwabing', 'monteurzimmer',
    'Leopoldstraße 42', 'München', '80802', 'Schwabing', 22, 1, 2, 650, 650, 1,
    '2026-01-15', 30, '["wifi", "kitchen", "washing"]', 1, 1, 'active');

  insertHousing.run('hous_002', 'verm_002', 'Möbliertes Apartment Zentrum', 'apartment',
    'Sendlinger Str. 15', 'München', '80331', 'Altstadt', 35, 1, 2, 850, 1700, 0,
    '2026-02-01', 90, '["wifi", "kitchen", "balcony"]', 1, 1, 'active');

  insertHousing.run('hous_003', 'verm_003', 'WG-Zimmer für Fachkräfte', 'wg',
    'Hohenzollernstr. 88', 'München', '80799', 'Schwabing', 18, 1, 1, 550, 550, 1,
    'sofort', 30, '["wifi", "kitchen", "washing", "parking"]', 1, 1, 'active');

  console.log('[DB] Seed housing inserted');
}

module.exports = db;
