require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3003;

// Cloud-Agents Integration
const CLOUD_AGENTS_URL = process.env.CLOUD_AGENTS_URL || 'http://178.156.178.70:3001';

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function createLeadSignature(lead) {
  const parts = [
    (lead.name || '').toLowerCase().trim(),
    (lead.email || '').toLowerCase().trim(),
    (lead.phone || '').replace(/\D/g, ''),
    (lead.company || '').toLowerCase().trim()
  ].filter(Boolean);
  return parts.join('|');
}

function calculateLeadScore(lead, criteria = {}) {
  let score = 50;
  if (lead.email) score += 15;
  if (lead.phone) score += 10;
  if (lead.company) score += 10;
  if (lead.position) score += 5;
  if (criteria.location && lead.location) {
    if (lead.location.toLowerCase().includes(criteria.location.toLowerCase())) {
      score += 10;
    }
  }
  return Math.min(100, Math.max(0, score));
}

function calculateHousingScore(housing, requirements) {
  let score = 0;

  // Preis passt ins Budget
  if (requirements.budget_max && housing.price_monthly <= requirements.budget_max) {
    score += 30;
  }

  // Stadt stimmt
  if (requirements.city && housing.city.toLowerCase() === requirements.city.toLowerCase()) {
    score += 20;
  }

  // Mietvertrag möglich (wichtig für Migranten)
  if (requirements.needs_mietvertrag && housing.mietvertrag_possible) {
    score += 25;
  }

  // Anmeldung möglich
  if (requirements.needs_anmeldung && housing.anmeldung_possible) {
    score += 15;
  }

  // Familiegröße passt
  if (requirements.family_size && housing.max_persons >= requirements.family_size) {
    score += 10;
  }

  return Math.min(100, score);
}

// ============================================================================
// HEALTH & STATS
// ============================================================================

app.get('/health', (req, res) => {
  const stats = {
    templates: db.prepare('SELECT COUNT(*) as c FROM templates').get().c,
    campaigns: db.prepare('SELECT COUNT(*) as c FROM campaigns').get().c,
    leads: db.prepare('SELECT COUNT(*) as c FROM leads').get().c,
    sources: db.prepare('SELECT COUNT(*) as c FROM sources').get().c,
    vermieter: db.prepare('SELECT COUNT(*) as c FROM vermieter').get().c,
    housing: db.prepare('SELECT COUNT(*) as c FROM housing').get().c,
    candidates: db.prepare('SELECT COUNT(*) as c FROM candidates').get().c,
    relocation_requests: db.prepare('SELECT COUNT(*) as c FROM relocation_requests').get().c,
    negotiations: db.prepare('SELECT COUNT(*) as c FROM negotiations').get().c,
    deals: db.prepare('SELECT COUNT(*) as c FROM deals').get().c
  };

  res.json({
    status: 'ok',
    service: 'lead-builder-backend',
    version: '3.0.0',
    timestamp: new Date().toISOString(),
    stats
  });
});

app.get('/api', (req, res) => {
  res.json({
    name: 'Lead Builder API',
    version: '3.0.0',
    description: 'Lead Management + ATU Relocation für bosnische Fachkräfte',
    endpoints: {
      core: ['/v1/campaigns', '/v1/leads', '/v1/communications', '/v1/templates'],
      housing: ['/v1/vermieter', '/v1/housing', '/v1/candidates'],
      relocation: ['/v1/relocation', '/v1/negotiations', '/v1/deals'],
      mcp: ['/v1/mcp/housing/search', '/v1/mcp/vermieter/:candidate_id', '/v1/mcp/deal'],
      agents: ['/v1/agents/trigger-call', '/v1/agents/search-housing']
    }
  });
});

// ============================================================================
// TEMPLATES (existing)
// ============================================================================

app.get('/v1/templates', (req, res) => {
  try {
    const { type } = req.query;
    let sql = 'SELECT * FROM templates';
    const params = [];
    if (type) { sql += ' WHERE type = ?'; params.push(type); }
    sql += ' ORDER BY usage_count DESC';
    const templates = db.prepare(sql).all(...params);
    res.json({ items: templates.map(t => ({ ...t, tags: JSON.parse(t.tags || '[]'), content: JSON.parse(t.content) })) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// BUILDER WORKFLOW (for Frontend)
// ============================================================================

// POST /v1/builder/draft - Create draft from input
app.post('/v1/builder/draft', (req, res) => {
  try {
    const { input_text, output_target, reuse_mode } = req.body;
    if (!input_text || !output_target || !reuse_mode) {
      return res.status(400).json({ error: 'input_text, output_target, reuse_mode required' });
    }

    const id = `draft_${uuidv4().slice(0, 8)}`;

    // Extract understanding from input
    const understanding = {
      bullets: [],
      entities: []
    };

    // Simple entity extraction
    const lower = input_text.toLowerCase();
    if (lower.includes('münchen')) understanding.entities.push({ type: 'location', value: 'München' });
    if (lower.includes('shk')) understanding.entities.push({ type: 'industry', value: 'SHK' });
    if (lower.includes('it')) understanding.entities.push({ type: 'industry', value: 'IT' });

    const numbers = input_text.match(/\d+/g);
    if (numbers) understanding.bullets.push(`Anzahl: ${numbers[0]}`);

    // Generate proposed intent spec
    const proposed_intent_spec = {
      type: output_target,
      name: `Auto-generated from: ${input_text.slice(0, 50)}`,
      search_spec: { limit: numbers ? parseInt(numbers[0]) : 100 }
    };

    db.prepare(`
      INSERT INTO drafts (id, input_text, output_target, reuse_mode, understanding, proposed_intent_spec, status)
      VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `).run(id, input_text, output_target, reuse_mode, JSON.stringify(understanding), JSON.stringify(proposed_intent_spec));

    res.status(201).json({
      draft_id: id,
      understanding,
      proposed_intent_spec
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /v1/builder/confirm - Confirm and execute draft
app.post('/v1/builder/confirm', (req, res) => {
  try {
    const { draft_id, confirmed_intent_spec } = req.body;
    if (!draft_id) return res.status(400).json({ error: 'draft_id required' });

    const draft = db.prepare('SELECT * FROM drafts WHERE id = ?').get(draft_id);
    if (!draft) return res.status(404).json({ error: 'Draft not found' });

    // Update draft status
    db.prepare("UPDATE drafts SET status = 'confirmed', confirmed_at = datetime('now') WHERE id = ?").run(draft_id);

    // Create artifact based on output_target
    const artifactId = `art_${uuidv4().slice(0, 8)}`;
    const spec = confirmed_intent_spec || JSON.parse(draft.proposed_intent_spec);

    db.prepare(`
      INSERT INTO artifacts (id, draft_id, type, content)
      VALUES (?, ?, ?, ?)
    `).run(artifactId, draft_id, draft.output_target, JSON.stringify(spec));

    res.json({
      artifact_id: artifactId,
      artifact_type: draft.output_target,
      artifact_content: spec
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /v1/templates/match - Find matching templates
app.post('/v1/templates/match', (req, res) => {
  try {
    const { input_text, output_target, limit = 5 } = req.body;
    if (!input_text) return res.status(400).json({ error: 'input_text required' });

    // Get all templates and score them
    let sql = 'SELECT * FROM templates';
    if (output_target) sql += ' WHERE type = ?';
    sql += ' ORDER BY usage_count DESC LIMIT ?';

    const params = output_target ? [output_target, limit] : [limit];
    const templates = db.prepare(sql).all(...params);

    // Simple matching based on keywords
    const lower = input_text.toLowerCase();
    const scored = templates.map(t => {
      let score = 0;
      const tags = JSON.parse(t.tags || '[]');
      tags.forEach(tag => {
        if (lower.includes(tag.toLowerCase())) score += 20;
      });
      if (lower.includes(t.title.toLowerCase())) score += 30;
      score += t.usage_count * 2;
      return { ...t, match_score: Math.min(100, score), tags, content: JSON.parse(t.content) };
    });

    scored.sort((a, b) => b.match_score - a.match_score);

    res.json({
      matches: scored.slice(0, limit),
      total_checked: templates.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /v1/templates/render - Render template with variables
app.post('/v1/templates/render', (req, res) => {
  try {
    const { template_id, variables } = req.body;
    if (!template_id) return res.status(400).json({ error: 'template_id required' });

    const template = db.prepare('SELECT * FROM templates WHERE id = ?').get(template_id);
    if (!template) return res.status(404).json({ error: 'Template not found' });

    // Update usage count
    db.prepare('UPDATE templates SET usage_count = usage_count + 1, last_used_at = datetime(\'now\') WHERE id = ?').run(template_id);

    let content = JSON.parse(template.content);

    // Simple variable replacement
    if (variables && typeof content === 'object') {
      const contentStr = JSON.stringify(content);
      let rendered = contentStr;
      Object.entries(variables).forEach(([key, value]) => {
        rendered = rendered.replace(new RegExp(`\\[${key}\\]`, 'g'), value);
        rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), value);
      });
      content = JSON.parse(rendered);
    }

    res.json({
      template_id,
      rendered_content: content,
      variables_applied: variables || {}
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// CAMPAIGNS (existing)
// ============================================================================

app.get('/v1/campaigns', (req, res) => {
  try {
    const { status, priority } = req.query;
    let sql = 'SELECT * FROM campaigns WHERE 1=1';
    const params = [];
    if (status) { sql += ' AND status = ?'; params.push(status); }
    if (priority) { sql += ' AND priority = ?'; params.push(priority); }
    sql += ' ORDER BY created_at DESC';
    const campaigns = db.prepare(sql).all(...params);
    res.json({ items: campaigns.map(c => ({ ...c, search_criteria: JSON.parse(c.search_criteria || '{}') })) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/v1/campaigns', (req, res) => {
  try {
    const { name, description, target_type, priority, target_count, search_criteria } = req.body;
    if (!name || !target_type) return res.status(400).json({ error: 'name and target_type required' });

    const id = `cmp_${uuidv4().slice(0, 8)}`;
    db.prepare(`
      INSERT INTO campaigns (id, name, description, target_type, priority, target_count, search_criteria)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, description || null, target_type, priority || 'normal', target_count || 100, JSON.stringify(search_criteria || {}));

    const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(id);
    res.status(201).json({ ...campaign, search_criteria: JSON.parse(campaign.search_criteria || '{}') });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/v1/campaigns/:id', (req, res) => {
  try {
    const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(req.params.id);
    if (!campaign) return res.status(404).json({ error: 'Not found' });
    res.json({ ...campaign, search_criteria: JSON.parse(campaign.search_criteria || '{}') });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /v1/campaigns/:id
app.patch('/v1/campaigns/:id', (req, res) => {
  try {
    const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(req.params.id);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

    const { name, description, status, priority, target_count, search_criteria } = req.body;
    const updates = [];
    const params = [];

    if (name !== undefined) { updates.push('name = ?'); params.push(name); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }
    if (status !== undefined) { updates.push('status = ?'); params.push(status); }
    if (priority !== undefined) { updates.push('priority = ?'); params.push(priority); }
    if (target_count !== undefined) { updates.push('target_count = ?'); params.push(target_count); }
    if (search_criteria !== undefined) { updates.push('search_criteria = ?'); params.push(JSON.stringify(search_criteria)); }

    if (updates.length > 0) {
      updates.push("updated_at = datetime('now')");
      params.push(req.params.id);
      db.prepare(`UPDATE campaigns SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    }

    const updated = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(req.params.id);
    res.json({ ...updated, search_criteria: JSON.parse(updated.search_criteria || '{}') });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /v1/campaigns/:id
app.delete('/v1/campaigns/:id', (req, res) => {
  try {
    const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(req.params.id);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

    db.prepare('DELETE FROM campaigns WHERE id = ?').run(req.params.id);
    res.json({ success: true, deleted_id: req.params.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /v1/campaigns/:id/stats
app.get('/v1/campaigns/:id/stats', (req, res) => {
  try {
    const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(req.params.id);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

    const leadStats = db.prepare(`
      SELECT
        COUNT(*) as total_leads,
        SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as new_leads,
        SUM(CASE WHEN status = 'contacted' THEN 1 ELSE 0 END) as contacted,
        SUM(CASE WHEN status = 'responded' THEN 1 ELSE 0 END) as responded,
        SUM(CASE WHEN status = 'qualified' THEN 1 ELSE 0 END) as qualified,
        SUM(CASE WHEN status = 'converted' THEN 1 ELSE 0 END) as converted,
        SUM(CASE WHEN quality = 'hot' THEN 1 ELSE 0 END) as hot_leads,
        AVG(score) as avg_score
      FROM leads WHERE campaign_id = ?
    `).get(req.params.id);

    const commStats = db.prepare(`
      SELECT
        COUNT(*) as total_communications,
        SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
        SUM(CASE WHEN direction = 'inbound' THEN 1 ELSE 0 END) as responses
      FROM communications WHERE campaign_id = ?
    `).get(req.params.id);

    res.json({
      campaign_id: req.params.id,
      campaign_name: campaign.name,
      leads: leadStats,
      communications: commStats,
      conversion_rate: leadStats.total_leads > 0 ? ((leadStats.converted / leadStats.total_leads) * 100).toFixed(2) : 0,
      response_rate: leadStats.contacted > 0 ? ((leadStats.responded / leadStats.contacted) * 100).toFixed(2) : 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// LEADS (existing)
// ============================================================================

app.get('/v1/leads', (req, res) => {
  try {
    const { campaign_id, status, quality, limit = 100, offset = 0 } = req.query;
    let sql = 'SELECT * FROM leads WHERE 1=1';
    const params = [];
    if (campaign_id) { sql += ' AND campaign_id = ?'; params.push(campaign_id); }
    if (status) { sql += ' AND status = ?'; params.push(status); }
    if (quality) { sql += ' AND quality = ?'; params.push(quality); }
    sql += ' ORDER BY score DESC, created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    const leads = db.prepare(sql).all(...params);
    res.json({ items: leads, limit: parseInt(limit), offset: parseInt(offset) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/v1/leads', (req, res) => {
  try {
    const { campaign_id, source, name, company, position, email, phone, location } = req.body;
    const id = `lead_${uuidv4().slice(0, 8)}`;
    const signature = createLeadSignature({ name, email, phone, company });
    const score = calculateLeadScore({ name, company, position, email, phone, location });

    db.prepare(`
      INSERT INTO leads (id, campaign_id, source, name, company, position, email, phone, location, signature, score)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, campaign_id || null, source || 'manual', name, company, position, email, phone, location, signature, score);

    const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(id);
    res.status(201).json(lead);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /v1/leads/batch - Batch import leads
app.post('/v1/leads/batch', (req, res) => {
  try {
    const { leads, campaign_id, source } = req.body;
    if (!leads || !Array.isArray(leads)) {
      return res.status(400).json({ error: 'leads array required' });
    }

    const results = { created: 0, duplicates: 0, errors: 0, items: [] };

    db.transaction(() => {
      for (const lead of leads) {
        try {
          const signature = createLeadSignature(lead);
          const existing = db.prepare('SELECT id FROM leads WHERE signature = ?').get(signature);

          if (existing) {
            results.duplicates++;
            continue;
          }

          const id = `lead_${uuidv4().slice(0, 8)}`;
          const score = calculateLeadScore(lead);

          db.prepare(`
            INSERT INTO leads (id, campaign_id, source, name, company, position, email, phone, location, signature, score)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(id, campaign_id || null, source || 'import', lead.name, lead.company, lead.position, lead.email, lead.phone, lead.location, signature, score);

          results.created++;
          results.items.push(id);
        } catch (e) {
          results.errors++;
        }
      }
    })();

    if (campaign_id) {
      db.prepare('UPDATE campaigns SET total_leads_found = total_leads_found + ? WHERE id = ?').run(results.created, campaign_id);
    }

    res.status(201).json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /v1/leads/:id
app.get('/v1/leads/:id', (req, res) => {
  try {
    const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    // Get communications for this lead
    const communications = db.prepare('SELECT * FROM communications WHERE lead_id = ? ORDER BY created_at DESC').all(req.params.id);

    res.json({
      ...lead,
      tags: JSON.parse(lead.tags || '[]'),
      raw_data: lead.raw_data ? JSON.parse(lead.raw_data) : null,
      enriched_data: lead.enriched_data ? JSON.parse(lead.enriched_data) : null,
      communications
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /v1/leads/:id
app.patch('/v1/leads/:id', (req, res) => {
  try {
    const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const { name, company, position, email, phone, location, status, quality, notes, tags } = req.body;
    const updates = [];
    const params = [];

    if (name !== undefined) { updates.push('name = ?'); params.push(name); }
    if (company !== undefined) { updates.push('company = ?'); params.push(company); }
    if (position !== undefined) { updates.push('position = ?'); params.push(position); }
    if (email !== undefined) { updates.push('email = ?'); params.push(email); }
    if (phone !== undefined) { updates.push('phone = ?'); params.push(phone); }
    if (location !== undefined) { updates.push('location = ?'); params.push(location); }
    if (status !== undefined) { updates.push('status = ?'); params.push(status); }
    if (quality !== undefined) { updates.push('quality = ?'); params.push(quality); }
    if (notes !== undefined) { updates.push('notes = ?'); params.push(notes); }
    if (tags !== undefined) { updates.push('tags = ?'); params.push(JSON.stringify(tags)); }

    if (updates.length > 0) {
      updates.push("updated_at = datetime('now')");
      updates.push("last_activity_at = datetime('now')");
      params.push(req.params.id);
      db.prepare(`UPDATE leads SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    }

    const updated = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /v1/leads/:id
app.delete('/v1/leads/:id', (req, res) => {
  try {
    const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    db.prepare('DELETE FROM leads WHERE id = ?').run(req.params.id);
    res.json({ success: true, deleted_id: req.params.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /v1/leads/:id/score - Recalculate lead score
app.post('/v1/leads/:id/score', (req, res) => {
  try {
    const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const criteria = req.body.criteria || {};
    const newScore = calculateLeadScore(lead, criteria);

    db.prepare("UPDATE leads SET score = ?, updated_at = datetime('now') WHERE id = ?").run(newScore, req.params.id);

    res.json({ lead_id: req.params.id, previous_score: lead.score, new_score: newScore });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// COMMUNICATIONS (existing)
// ============================================================================

app.get('/v1/communications', (req, res) => {
  try {
    const { lead_id, campaign_id, channel, limit = 50 } = req.query;
    let sql = 'SELECT * FROM communications WHERE 1=1';
    const params = [];
    if (lead_id) { sql += ' AND lead_id = ?'; params.push(lead_id); }
    if (campaign_id) { sql += ' AND campaign_id = ?'; params.push(campaign_id); }
    if (channel) { sql += ' AND channel = ?'; params.push(channel); }
    sql += ' ORDER BY created_at DESC LIMIT ?';
    params.push(parseInt(limit));
    res.json({ items: db.prepare(sql).all(...params) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /v1/communications
app.post('/v1/communications', (req, res) => {
  try {
    const { lead_id, campaign_id, channel, type, subject, message, template_id } = req.body;
    if (!channel || !message) return res.status(400).json({ error: 'channel and message required' });

    const id = `comm_${uuidv4().slice(0, 8)}`;
    db.prepare(`
      INSERT INTO communications (id, lead_id, campaign_id, channel, direction, type, subject, message, template_id, status, sent_at)
      VALUES (?, ?, ?, ?, 'outbound', ?, ?, ?, ?, 'sent', datetime('now'))
    `).run(id, lead_id || null, campaign_id || null, channel, type || 'initial', subject, message, template_id);

    if (lead_id) {
      db.prepare("UPDATE leads SET status = 'contacted', contacted_at = datetime('now'), last_activity_at = datetime('now') WHERE id = ? AND status = 'new'").run(lead_id);
    }
    if (campaign_id) {
      db.prepare('UPDATE campaigns SET total_contacted = total_contacted + 1 WHERE id = ?').run(campaign_id);
    }

    const comm = db.prepare('SELECT * FROM communications WHERE id = ?').get(id);
    res.status(201).json(comm);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /v1/communications/batch
app.post('/v1/communications/batch', (req, res) => {
  try {
    const { lead_ids, campaign_id, channel, type, subject, message } = req.body;
    if (!lead_ids || !Array.isArray(lead_ids) || !channel || !message) {
      return res.status(400).json({ error: 'lead_ids array, channel, and message required' });
    }

    const results = { sent: 0, failed: 0, items: [] };

    db.transaction(() => {
      for (const lead_id of lead_ids) {
        try {
          const id = `comm_${uuidv4().slice(0, 8)}`;
          db.prepare(`
            INSERT INTO communications (id, lead_id, campaign_id, channel, direction, type, subject, message, status, sent_at)
            VALUES (?, ?, ?, ?, 'outbound', ?, ?, ?, 'sent', datetime('now'))
          `).run(id, lead_id, campaign_id || null, channel, type || 'initial', subject, message);

          db.prepare("UPDATE leads SET status = 'contacted', contacted_at = datetime('now'), last_activity_at = datetime('now') WHERE id = ? AND status = 'new'").run(lead_id);
          results.sent++;
          results.items.push(id);
        } catch (e) {
          results.failed++;
        }
      }
    })();

    if (campaign_id) {
      db.prepare('UPDATE campaigns SET total_contacted = total_contacted + ? WHERE id = ?').run(results.sent, campaign_id);
    }

    res.status(201).json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /v1/communications/:id/response
app.post('/v1/communications/:id/response', (req, res) => {
  try {
    const { response_text } = req.body;
    if (!response_text) return res.status(400).json({ error: 'response_text required' });

    const comm = db.prepare('SELECT * FROM communications WHERE id = ?').get(req.params.id);
    if (!comm) return res.status(404).json({ error: 'Communication not found' });

    const responseId = `comm_${uuidv4().slice(0, 8)}`;
    db.prepare(`
      INSERT INTO communications (id, lead_id, campaign_id, channel, direction, type, message, status)
      VALUES (?, ?, ?, ?, 'inbound', 'response', ?, 'delivered')
    `).run(responseId, comm.lead_id, comm.campaign_id, comm.channel, response_text);

    db.prepare("UPDATE communications SET responded_at = datetime('now') WHERE id = ?").run(req.params.id);

    if (comm.lead_id) {
      db.prepare("UPDATE leads SET status = 'responded', responded_at = datetime('now'), last_activity_at = datetime('now') WHERE id = ?").run(comm.lead_id);
    }
    if (comm.campaign_id) {
      db.prepare('UPDATE campaigns SET total_responses = total_responses + 1 WHERE id = ?').run(comm.campaign_id);
    }

    res.json({ response_id: responseId, original_id: req.params.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// SOURCES (existing)
// ============================================================================

app.get('/v1/sources', (req, res) => {
  try {
    const sources = db.prepare('SELECT * FROM sources ORDER BY name').all();
    res.json({ items: sources.map(s => ({ ...s, config: JSON.parse(s.config || '{}') })) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /v1/sources
app.post('/v1/sources', (req, res) => {
  try {
    const { name, type, platform, config, is_active } = req.body;
    if (!name || !type) return res.status(400).json({ error: 'name and type required' });

    const id = `src_${uuidv4().slice(0, 8)}`;
    db.prepare(`
      INSERT INTO sources (id, name, type, platform, config, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, name, type, platform, JSON.stringify(config || {}), is_active !== false ? 1 : 0);

    const source = db.prepare('SELECT * FROM sources WHERE id = ?').get(id);
    res.status(201).json({ ...source, config: JSON.parse(source.config || '{}') });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /v1/sources/:id
app.patch('/v1/sources/:id', (req, res) => {
  try {
    const source = db.prepare('SELECT * FROM sources WHERE id = ?').get(req.params.id);
    if (!source) return res.status(404).json({ error: 'Source not found' });

    const { name, config, is_active } = req.body;
    const updates = [];
    const params = [];

    if (name !== undefined) { updates.push('name = ?'); params.push(name); }
    if (config !== undefined) { updates.push('config = ?'); params.push(JSON.stringify(config)); }
    if (is_active !== undefined) { updates.push('is_active = ?'); params.push(is_active ? 1 : 0); }

    if (updates.length > 0) {
      updates.push("updated_at = datetime('now')");
      params.push(req.params.id);
      db.prepare(`UPDATE sources SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    }

    const updated = db.prepare('SELECT * FROM sources WHERE id = ?').get(req.params.id);
    res.json({ ...updated, config: JSON.parse(updated.config || '{}') });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// ANALYSES (AI Response Analysis)
// ============================================================================

// GET /v1/analyses
app.get('/v1/analyses', (req, res) => {
  try {
    const { lead_id, analysis_type, limit = 50 } = req.query;
    let sql = 'SELECT * FROM analyses WHERE 1=1';
    const params = [];

    if (lead_id) { sql += ' AND lead_id = ?'; params.push(lead_id); }
    if (analysis_type) { sql += ' AND analysis_type = ?'; params.push(analysis_type); }

    sql += ' ORDER BY created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const analyses = db.prepare(sql).all(...params);
    res.json({
      items: analyses.map(a => ({ ...a, result: JSON.parse(a.result || '{}') }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /v1/analyses
app.post('/v1/analyses', (req, res) => {
  try {
    const { communication_id, lead_id, analysis_type, text_to_analyze } = req.body;
    if (!analysis_type || !text_to_analyze) {
      return res.status(400).json({ error: 'analysis_type and text_to_analyze required' });
    }

    const id = `ana_${uuidv4().slice(0, 8)}`;

    // Simple sentiment analysis
    const lower = text_to_analyze.toLowerCase();
    const positiveWords = ['ja', 'interessiert', 'gerne', 'verfügbar', 'super', 'toll', 'danke'];
    const negativeWords = ['nein', 'nicht', 'leider', 'absage', 'kein interesse'];

    const positiveCount = positiveWords.filter(w => lower.includes(w)).length;
    const negativeCount = negativeWords.filter(w => lower.includes(w)).length;

    const sentiment = positiveCount > negativeCount ? 'positive' : negativeCount > positiveCount ? 'negative' : 'neutral';
    const confidence = Math.abs(positiveCount - negativeCount) / (positiveCount + negativeCount + 1);

    const result = { sentiment, keywords_found: { positive: positiveCount, negative: negativeCount } };
    const recommendedAction = sentiment === 'positive' ? 'follow_up' : sentiment === 'negative' ? 'archive' : 'review';

    db.prepare(`
      INSERT INTO analyses (id, communication_id, lead_id, analysis_type, result, confidence, sentiment, recommended_action)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, communication_id || null, lead_id || null, analysis_type, JSON.stringify(result), confidence, sentiment, recommendedAction);

    if (lead_id) {
      const quality = sentiment === 'positive' ? 'hot' : sentiment === 'negative' ? 'cold' : 'warm';
      db.prepare("UPDATE leads SET quality = ?, updated_at = datetime('now') WHERE id = ?").run(quality, lead_id);
    }

    const analysis = db.prepare('SELECT * FROM analyses WHERE id = ?').get(id);
    res.status(201).json({ ...analysis, result: JSON.parse(analysis.result) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// REPORTS
// ============================================================================

// GET /v1/reports
app.get('/v1/reports', (req, res) => {
  try {
    const { campaign_id, report_type, limit = 20 } = req.query;
    let sql = 'SELECT * FROM reports WHERE 1=1';
    const params = [];

    if (campaign_id) { sql += ' AND campaign_id = ?'; params.push(campaign_id); }
    if (report_type) { sql += ' AND report_type = ?'; params.push(report_type); }

    sql += ' ORDER BY created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const reports = db.prepare(sql).all(...params);
    res.json({
      items: reports.map(r => ({
        ...r,
        content: JSON.parse(r.content || '{}'),
        metrics: JSON.parse(r.metrics || '{}')
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /v1/reports
app.post('/v1/reports', (req, res) => {
  try {
    const { campaign_id, report_type, period_start, period_end } = req.body;
    if (!report_type) return res.status(400).json({ error: 'report_type required' });

    const id = `rpt_${uuidv4().slice(0, 8)}`;
    let metrics = {};
    let content = {};

    if (campaign_id) {
      const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(campaign_id);
      const leadStats = db.prepare(`
        SELECT COUNT(*) as total, AVG(score) as avg_score,
        SUM(CASE WHEN status = 'converted' THEN 1 ELSE 0 END) as converted
        FROM leads WHERE campaign_id = ?
      `).get(campaign_id);

      metrics = {
        total_leads: leadStats.total,
        avg_score: leadStats.avg_score?.toFixed(2) || 0,
        conversion_rate: leadStats.total > 0 ? ((leadStats.converted / leadStats.total) * 100).toFixed(2) : 0
      };
      content = { campaign_name: campaign?.name || 'Unknown', summary: `${leadStats.total} Leads, ${metrics.conversion_rate}% Konversion` };
    } else {
      const totalLeads = db.prepare('SELECT COUNT(*) as count FROM leads').get().count;
      const totalCampaigns = db.prepare('SELECT COUNT(*) as count FROM campaigns').get().count;
      metrics = { total_leads: totalLeads, total_campaigns: totalCampaigns };
      content = { summary: `${totalCampaigns} Kampagnen, ${totalLeads} Leads` };
    }

    const title = `${report_type} Report - ${new Date().toLocaleDateString('de-DE')}`;

    db.prepare(`
      INSERT INTO reports (id, campaign_id, report_type, title, content, format, period_start, period_end, metrics)
      VALUES (?, ?, ?, ?, ?, 'json', ?, ?, ?)
    `).run(id, campaign_id || null, report_type, title, JSON.stringify(content), period_start, period_end, JSON.stringify(metrics));

    const report = db.prepare('SELECT * FROM reports WHERE id = ?').get(id);
    res.status(201).json({ ...report, content: JSON.parse(report.content), metrics: JSON.parse(report.metrics || '{}') });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// SCHEDULED TASKS
// ============================================================================

// GET /v1/tasks
app.get('/v1/tasks', (req, res) => {
  try {
    const { status, task_type, limit = 50 } = req.query;
    let sql = 'SELECT * FROM scheduled_tasks WHERE 1=1';
    const params = [];

    if (status) { sql += ' AND status = ?'; params.push(status); }
    if (task_type) { sql += ' AND task_type = ?'; params.push(task_type); }

    sql += ' ORDER BY scheduled_at ASC LIMIT ?';
    params.push(parseInt(limit));

    const tasks = db.prepare(sql).all(...params);
    res.json({
      items: tasks.map(t => ({
        ...t,
        payload: t.payload ? JSON.parse(t.payload) : null,
        result: t.result ? JSON.parse(t.result) : null
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /v1/tasks
app.post('/v1/tasks', (req, res) => {
  try {
    const { task_type, reference_id, reference_type, scheduled_at, payload } = req.body;
    if (!task_type || !scheduled_at) {
      return res.status(400).json({ error: 'task_type and scheduled_at required' });
    }

    const id = `task_${uuidv4().slice(0, 8)}`;
    db.prepare(`
      INSERT INTO scheduled_tasks (id, task_type, reference_id, reference_type, scheduled_at, payload)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, task_type, reference_id, reference_type, scheduled_at, payload ? JSON.stringify(payload) : null);

    const task = db.prepare('SELECT * FROM scheduled_tasks WHERE id = ?').get(id);
    res.status(201).json({ ...task, payload: task.payload ? JSON.parse(task.payload) : null });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// VERMIETER (Landlords) - NEW
// ============================================================================

app.get('/v1/vermieter', (req, res) => {
  try {
    const { city, status, limit = 100 } = req.query;
    let sql = 'SELECT * FROM vermieter WHERE 1=1';
    const params = [];
    if (city) { sql += ' AND city = ?'; params.push(city); }
    if (status) { sql += ' AND status = ?'; params.push(status); }
    sql += ' ORDER BY rating DESC, total_deals DESC LIMIT ?';
    params.push(parseInt(limit));
    const vermieter = db.prepare(sql).all(...params);
    res.json({ items: vermieter.map(v => ({ ...v, languages: JSON.parse(v.languages || '[]'), tags: JSON.parse(v.tags || '[]') })) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/v1/vermieter', (req, res) => {
  try {
    const { name, company, phone, email, address, city, postal_code, languages, notes } = req.body;
    if (!name || !phone) return res.status(400).json({ error: 'name and phone required' });

    const id = `verm_${uuidv4().slice(0, 8)}`;
    db.prepare(`
      INSERT INTO vermieter (id, name, company, phone, email, address, city, postal_code, languages, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, company, phone, email, address, city || 'München', postal_code, JSON.stringify(languages || ['de']), notes);

    const vermieter = db.prepare('SELECT * FROM vermieter WHERE id = ?').get(id);
    res.status(201).json({ ...vermieter, languages: JSON.parse(vermieter.languages || '[]') });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/v1/vermieter/:id', (req, res) => {
  try {
    const vermieter = db.prepare('SELECT * FROM vermieter WHERE id = ?').get(req.params.id);
    if (!vermieter) return res.status(404).json({ error: 'Vermieter not found' });

    // Get their housing
    const housing = db.prepare('SELECT * FROM housing WHERE vermieter_id = ?').all(req.params.id);

    res.json({
      ...vermieter,
      languages: JSON.parse(vermieter.languages || '[]'),
      housing: housing.map(h => ({ ...h, amenities: JSON.parse(h.amenities || '[]') }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// HOUSING (Wohnungen/Monteurzimmer) - NEW
// ============================================================================

app.get('/v1/housing', (req, res) => {
  try {
    const { city, type, max_price, min_size, is_available, mietvertrag_possible, limit = 50 } = req.query;
    let sql = `
      SELECT h.*, v.name as vermieter_name, v.phone as vermieter_phone
      FROM housing h
      LEFT JOIN vermieter v ON h.vermieter_id = v.id
      WHERE 1=1
    `;
    const params = [];

    if (city) { sql += ' AND h.city = ?'; params.push(city); }
    if (type) { sql += ' AND h.type = ?'; params.push(type); }
    if (max_price) { sql += ' AND h.price_monthly <= ?'; params.push(parseFloat(max_price)); }
    if (min_size) { sql += ' AND h.size_sqm >= ?'; params.push(parseFloat(min_size)); }
    if (is_available !== undefined) { sql += ' AND h.is_available = ?'; params.push(is_available === 'true' ? 1 : 0); }
    if (mietvertrag_possible !== undefined) { sql += ' AND h.mietvertrag_possible = ?'; params.push(mietvertrag_possible === 'true' ? 1 : 0); }

    sql += ' ORDER BY h.price_monthly ASC LIMIT ?';
    params.push(parseInt(limit));

    const housing = db.prepare(sql).all(...params);
    res.json({
      items: housing.map(h => ({
        ...h,
        amenities: JSON.parse(h.amenities || '[]'),
        images: JSON.parse(h.images || '[]')
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/v1/housing', (req, res) => {
  try {
    const {
      vermieter_id, title, type, address, city, postal_code, district,
      size_sqm, rooms, max_persons, price_monthly, price_weekly, deposit,
      utilities_included, available_from, min_stay_days, amenities,
      mietvertrag_possible, anmeldung_possible
    } = req.body;

    if (!vermieter_id || !title || !type || !price_monthly) {
      return res.status(400).json({ error: 'vermieter_id, title, type, price_monthly required' });
    }

    const id = `hous_${uuidv4().slice(0, 8)}`;
    db.prepare(`
      INSERT INTO housing (id, vermieter_id, title, type, address, city, postal_code, district,
        size_sqm, rooms, max_persons, price_monthly, price_weekly, deposit, utilities_included,
        available_from, min_stay_days, amenities, mietvertrag_possible, anmeldung_possible)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, vermieter_id, title, type, address, city || 'München', postal_code, district,
      size_sqm, rooms || 1, max_persons || 1, price_monthly, price_weekly, deposit,
      utilities_included ? 1 : 0, available_from, min_stay_days || 30,
      JSON.stringify(amenities || []), mietvertrag_possible !== false ? 1 : 0, anmeldung_possible !== false ? 1 : 0);

    const housing = db.prepare('SELECT * FROM housing WHERE id = ?').get(id);
    res.status(201).json({ ...housing, amenities: JSON.parse(housing.amenities || '[]') });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// CANDIDATES (ATU Fachkräfte) - NEW
// ============================================================================

app.get('/v1/candidates', (req, res) => {
  try {
    const { status, employer, limit = 100 } = req.query;
    let sql = 'SELECT * FROM candidates WHERE 1=1';
    const params = [];
    if (status) { sql += ' AND status = ?'; params.push(status); }
    if (employer) { sql += ' AND employer = ?'; params.push(employer); }
    sql += ' ORDER BY created_at DESC LIMIT ?';
    params.push(parseInt(limit));
    const candidates = db.prepare(sql).all(...params);
    res.json({
      items: candidates.map(c => ({
        ...c,
        language_skills: JSON.parse(c.language_skills || '[]'),
        preferred_districts: JSON.parse(c.preferred_districts || '[]')
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/v1/candidates', (req, res) => {
  try {
    const {
      name, phone, email, nationality, language_skills,
      employer, job_position, job_location, job_start_date,
      arrival_date, preferred_city, budget_max, family_size,
      needs_mietvertrag, needs_anmeldung, move_in_date, notes
    } = req.body;

    if (!name || !phone) return res.status(400).json({ error: 'name and phone required' });

    const id = `cand_${uuidv4().slice(0, 8)}`;
    db.prepare(`
      INSERT INTO candidates (id, name, phone, email, nationality, language_skills,
        employer, job_position, job_location, job_start_date, arrival_date,
        preferred_city, budget_max, family_size, needs_mietvertrag, needs_anmeldung, move_in_date, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, phone, email, nationality || 'BA', JSON.stringify(language_skills || ['de', 'bs']),
      employer || 'ATU', job_position, job_location || 'München', job_start_date, arrival_date,
      preferred_city || 'München', budget_max || 800, family_size || 1,
      needs_mietvertrag !== false ? 1 : 0, needs_anmeldung !== false ? 1 : 0, move_in_date, notes);

    const candidate = db.prepare('SELECT * FROM candidates WHERE id = ?').get(id);
    res.status(201).json({ ...candidate, language_skills: JSON.parse(candidate.language_skills || '[]') });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/v1/candidates/:id', (req, res) => {
  try {
    const candidate = db.prepare('SELECT * FROM candidates WHERE id = ?').get(req.params.id);
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

    // Get relocation requests
    const requests = db.prepare('SELECT * FROM relocation_requests WHERE candidate_id = ?').all(req.params.id);

    res.json({
      ...candidate,
      language_skills: JSON.parse(candidate.language_skills || '[]'),
      preferred_districts: JSON.parse(candidate.preferred_districts || '[]'),
      relocation_requests: requests
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// RELOCATION REQUESTS - NEW
// ============================================================================

app.get('/v1/relocation', (req, res) => {
  try {
    const { status, priority, limit = 50 } = req.query;
    let sql = `
      SELECT r.*, c.name as candidate_name, c.phone as candidate_phone
      FROM relocation_requests r
      LEFT JOIN candidates c ON r.candidate_id = c.id
      WHERE 1=1
    `;
    const params = [];
    if (status) { sql += ' AND r.status = ?'; params.push(status); }
    if (priority) { sql += ' AND r.priority = ?'; params.push(priority); }
    sql += ' ORDER BY r.created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const requests = db.prepare(sql).all(...params);
    res.json({
      items: requests.map(r => ({
        ...r,
        requirements: JSON.parse(r.requirements || '{}'),
        matched_housing: JSON.parse(r.matched_housing || '[]')
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/v1/relocation', (req, res) => {
  try {
    const { candidate_id, campaign_id, requirements, priority } = req.body;
    if (!candidate_id) return res.status(400).json({ error: 'candidate_id required' });

    // Get candidate for default requirements
    const candidate = db.prepare('SELECT * FROM candidates WHERE id = ?').get(candidate_id);
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

    const defaultRequirements = {
      city: candidate.preferred_city || 'München',
      budget_max: candidate.budget_max || 800,
      family_size: candidate.family_size || 1,
      needs_mietvertrag: candidate.needs_mietvertrag === 1,
      needs_anmeldung: candidate.needs_anmeldung === 1,
      move_in_date: candidate.move_in_date
    };

    const id = `rel_${uuidv4().slice(0, 8)}`;
    const mergedRequirements = { ...defaultRequirements, ...requirements };

    db.prepare(`
      INSERT INTO relocation_requests (id, candidate_id, campaign_id, requirements, priority, status, started_at)
      VALUES (?, ?, ?, ?, ?, 'searching', datetime('now'))
    `).run(id, candidate_id, campaign_id, JSON.stringify(mergedRequirements), priority || 'normal');

    // Automatically search for matching housing
    const matchedHousing = findMatchingHousing(mergedRequirements);
    if (matchedHousing.length > 0) {
      db.prepare('UPDATE relocation_requests SET matched_housing = ? WHERE id = ?')
        .run(JSON.stringify(matchedHousing.map(h => h.id)), id);
    }

    const request = db.prepare('SELECT * FROM relocation_requests WHERE id = ?').get(id);
    res.status(201).json({
      ...request,
      requirements: JSON.parse(request.requirements || '{}'),
      matched_housing: matchedHousing
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function findMatchingHousing(requirements) {
  let sql = `
    SELECT h.*, v.name as vermieter_name, v.phone as vermieter_phone
    FROM housing h
    LEFT JOIN vermieter v ON h.vermieter_id = v.id
    WHERE h.is_available = 1 AND h.status = 'active'
  `;
  const params = [];

  if (requirements.city) { sql += ' AND h.city = ?'; params.push(requirements.city); }
  if (requirements.budget_max) { sql += ' AND h.price_monthly <= ?'; params.push(requirements.budget_max); }
  if (requirements.family_size) { sql += ' AND h.max_persons >= ?'; params.push(requirements.family_size); }
  if (requirements.needs_mietvertrag) { sql += ' AND h.mietvertrag_possible = 1'; }
  if (requirements.needs_anmeldung) { sql += ' AND h.anmeldung_possible = 1'; }

  sql += ' ORDER BY h.price_monthly ASC LIMIT 10';

  const housing = db.prepare(sql).all(...params);
  return housing.map(h => ({
    ...h,
    amenities: JSON.parse(h.amenities || '[]'),
    score: calculateHousingScore(h, requirements)
  })).sort((a, b) => b.score - a.score);
}

// ============================================================================
// NEGOTIATIONS - NEW
// ============================================================================

app.get('/v1/negotiations', (req, res) => {
  try {
    const { status, candidate_id, limit = 50 } = req.query;
    let sql = `
      SELECT n.*, c.name as candidate_name, v.name as vermieter_name, h.title as housing_title
      FROM negotiations n
      LEFT JOIN candidates c ON n.candidate_id = c.id
      LEFT JOIN vermieter v ON n.vermieter_id = v.id
      LEFT JOIN housing h ON n.housing_id = h.id
      WHERE 1=1
    `;
    const params = [];
    if (status) { sql += ' AND n.status = ?'; params.push(status); }
    if (candidate_id) { sql += ' AND n.candidate_id = ?'; params.push(candidate_id); }
    sql += ' ORDER BY n.created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    res.json({ items: db.prepare(sql).all(...params) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/v1/negotiations', (req, res) => {
  try {
    const { relocation_request_id, candidate_id, vermieter_id, housing_id, offered_price } = req.body;
    if (!candidate_id || !vermieter_id || !housing_id) {
      return res.status(400).json({ error: 'candidate_id, vermieter_id, housing_id required' });
    }

    const id = `neg_${uuidv4().slice(0, 8)}`;
    db.prepare(`
      INSERT INTO negotiations (id, relocation_request_id, candidate_id, vermieter_id, housing_id, offered_price, status)
      VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `).run(id, relocation_request_id, candidate_id, vermieter_id, housing_id, offered_price);

    const negotiation = db.prepare('SELECT * FROM negotiations WHERE id = ?').get(id);
    res.status(201).json(negotiation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/v1/negotiations/:id', (req, res) => {
  try {
    const { status, final_price, move_in_date, notes, rejection_reason, call_transcript } = req.body;
    const negotiation = db.prepare('SELECT * FROM negotiations WHERE id = ?').get(req.params.id);
    if (!negotiation) return res.status(404).json({ error: 'Negotiation not found' });

    const updates = [];
    const params = [];

    if (status) { updates.push('status = ?'); params.push(status); }
    if (final_price) { updates.push('final_price = ?'); params.push(final_price); }
    if (move_in_date) { updates.push('move_in_date = ?'); params.push(move_in_date); }
    if (notes) { updates.push('notes = ?'); params.push(notes); }
    if (rejection_reason) { updates.push('rejection_reason = ?'); params.push(rejection_reason); }
    if (call_transcript) { updates.push('call_transcript = ?'); params.push(JSON.stringify(call_transcript)); }

    updates.push("updated_at = datetime('now')");
    params.push(req.params.id);

    db.prepare(`UPDATE negotiations SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    // If accepted, create a deal
    if (status === 'accepted') {
      const dealId = `deal_${uuidv4().slice(0, 8)}`;
      db.prepare(`
        INSERT INTO deals (id, negotiation_id, candidate_id, vermieter_id, housing_id, monthly_rent, move_in_date, contract_start, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
      `).run(dealId, req.params.id, negotiation.candidate_id, negotiation.vermieter_id, negotiation.housing_id,
        final_price || negotiation.offered_price, move_in_date, move_in_date);

      // Update relocation request
      if (negotiation.relocation_request_id) {
        db.prepare("UPDATE relocation_requests SET status = 'found', final_housing_id = ?, completed_at = datetime('now') WHERE id = ?")
          .run(negotiation.housing_id, negotiation.relocation_request_id);
      }

      // Update candidate
      db.prepare("UPDATE candidates SET status = 'found', assigned_housing_id = ? WHERE id = ?")
        .run(negotiation.housing_id, negotiation.candidate_id);

      // Update housing
      db.prepare("UPDATE housing SET status = 'reserved', is_available = 0 WHERE id = ?")
        .run(negotiation.housing_id);
    }

    const updated = db.prepare('SELECT * FROM negotiations WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// DEALS - NEW
// ============================================================================

app.get('/v1/deals', (req, res) => {
  try {
    const { status, limit = 50 } = req.query;
    let sql = `
      SELECT d.*, c.name as candidate_name, v.name as vermieter_name, h.title as housing_title, h.address
      FROM deals d
      LEFT JOIN candidates c ON d.candidate_id = c.id
      LEFT JOIN vermieter v ON d.vermieter_id = v.id
      LEFT JOIN housing h ON d.housing_id = h.id
      WHERE 1=1
    `;
    const params = [];
    if (status) { sql += ' AND d.status = ?'; params.push(status); }
    sql += ' ORDER BY d.created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    res.json({ items: db.prepare(sql).all(...params) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/v1/deals/:id', (req, res) => {
  try {
    const { status, contract_signed, deposit_paid, keys_handed_over, anmeldung_done, notes } = req.body;
    const deal = db.prepare('SELECT * FROM deals WHERE id = ?').get(req.params.id);
    if (!deal) return res.status(404).json({ error: 'Deal not found' });

    const updates = [];
    const params = [];

    if (status) { updates.push('status = ?'); params.push(status); }
    if (contract_signed !== undefined) { updates.push('contract_signed = ?'); params.push(contract_signed ? 1 : 0); }
    if (deposit_paid !== undefined) { updates.push('deposit_paid = ?'); params.push(deposit_paid ? 1 : 0); }
    if (keys_handed_over !== undefined) { updates.push('keys_handed_over = ?'); params.push(keys_handed_over ? 1 : 0); }
    if (anmeldung_done !== undefined) { updates.push('anmeldung_done = ?'); params.push(anmeldung_done ? 1 : 0); }
    if (notes) { updates.push('notes = ?'); params.push(notes); }

    if (contract_signed) { updates.push("signed_at = datetime('now')"); }
    if (keys_handed_over) { updates.push("moved_in_at = datetime('now')"); }
    if (status === 'active') {
      db.prepare("UPDATE candidates SET status = 'moved_in' WHERE id = ?").run(deal.candidate_id);
      db.prepare("UPDATE housing SET status = 'rented' WHERE id = ?").run(deal.housing_id);
      db.prepare("UPDATE vermieter SET total_deals = total_deals + 1, last_deal_at = datetime('now') WHERE id = ?").run(deal.vermieter_id);
    }

    updates.push("updated_at = datetime('now')");
    params.push(req.params.id);

    db.prepare(`UPDATE deals SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    const updated = db.prepare('SELECT * FROM deals WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// MCP ENDPOINTS (für Relocation Agent)
// ============================================================================

// MCP: Suche Monteurzimmer für Kandidat
app.get('/v1/mcp/housing/search', (req, res) => {
  try {
    const { city, budget_max, family_size, needs_mietvertrag, needs_anmeldung } = req.query;

    const requirements = {
      city: city || 'München',
      budget_max: budget_max ? parseFloat(budget_max) : 1000,
      family_size: family_size ? parseInt(family_size) : 1,
      needs_mietvertrag: needs_mietvertrag !== 'false',
      needs_anmeldung: needs_anmeldung !== 'false'
    };

    const housing = findMatchingHousing(requirements);

    res.json({
      success: true,
      query: requirements,
      count: housing.length,
      results: housing
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// MCP: Get Vermieter-Liste für Kandidat (Relocation Agent holt diese)
app.get('/v1/mcp/vermieter/:candidate_id', (req, res) => {
  try {
    const candidate = db.prepare('SELECT * FROM candidates WHERE id = ?').get(req.params.candidate_id);
    if (!candidate) return res.status(404).json({ success: false, error: 'Candidate not found' });

    // Find matching housing with vermieter
    const requirements = {
      city: candidate.preferred_city || 'München',
      budget_max: candidate.budget_max || 800,
      family_size: candidate.family_size || 1,
      needs_mietvertrag: candidate.needs_mietvertrag === 1,
      needs_anmeldung: candidate.needs_anmeldung === 1
    };

    const housing = findMatchingHousing(requirements);

    // Format for Relocation Agent
    const vermieterList = housing.map(h => ({
      vermieter_id: h.vermieter_id,
      vermieter_name: h.vermieter_name,
      vermieter_phone: h.vermieter_phone,
      housing_id: h.id,
      housing_title: h.title,
      housing_type: h.type,
      address: h.address,
      city: h.city,
      price: h.price_monthly,
      score: h.score,
      mietvertrag_possible: h.mietvertrag_possible === 1,
      anmeldung_possible: h.anmeldung_possible === 1
    }));

    res.json({
      success: true,
      candidate: {
        id: candidate.id,
        name: candidate.name,
        employer: candidate.employer,
        budget_max: candidate.budget_max
      },
      vermieter: vermieterList
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// MCP: Save Deal (Relocation Agent speichert Ergebnis)
app.post('/v1/mcp/deal', (req, res) => {
  try {
    const { candidate_id, vermieter_id, housing_id, monthly_rent, move_in_date, notes, call_summary } = req.body;

    if (!candidate_id || !vermieter_id || !housing_id) {
      return res.status(400).json({ success: false, error: 'candidate_id, vermieter_id, housing_id required' });
    }

    // Create negotiation record
    const negId = `neg_${uuidv4().slice(0, 8)}`;
    db.prepare(`
      INSERT INTO negotiations (id, candidate_id, vermieter_id, housing_id, status, final_price, move_in_date, notes, call_transcript)
      VALUES (?, ?, ?, ?, 'accepted', ?, ?, ?, ?)
    `).run(negId, candidate_id, vermieter_id, housing_id, monthly_rent, move_in_date, notes, JSON.stringify([{ summary: call_summary, timestamp: new Date().toISOString() }]));

    // Create deal
    const dealId = `deal_${uuidv4().slice(0, 8)}`;
    db.prepare(`
      INSERT INTO deals (id, negotiation_id, candidate_id, vermieter_id, housing_id, monthly_rent, move_in_date, contract_start, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `).run(dealId, negId, candidate_id, vermieter_id, housing_id, monthly_rent, move_in_date, move_in_date);

    // Update statuses
    db.prepare("UPDATE candidates SET status = 'found', assigned_housing_id = ? WHERE id = ?").run(housing_id, candidate_id);
    db.prepare("UPDATE housing SET status = 'reserved', is_available = 0 WHERE id = ?").run(housing_id);

    res.json({
      success: true,
      deal_id: dealId,
      negotiation_id: negId,
      message: 'Deal erfolgreich gespeichert'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// AGENT INTEGRATION (Cloud-Agents Voice Calls)
// ============================================================================

// Trigger Voice Call to Vermieter
app.post('/v1/agents/trigger-call', async (req, res) => {
  try {
    const { candidate_id, vermieter_id, housing_id, agent_name } = req.body;

    if (!candidate_id || !vermieter_id) {
      return res.status(400).json({ error: 'candidate_id and vermieter_id required' });
    }

    const candidate = db.prepare('SELECT * FROM candidates WHERE id = ?').get(candidate_id);
    const vermieter = db.prepare('SELECT * FROM vermieter WHERE id = ?').get(vermieter_id);
    const housing = housing_id ? db.prepare('SELECT * FROM housing WHERE id = ?').get(housing_id) : null;

    if (!candidate || !vermieter) {
      return res.status(404).json({ error: 'Candidate or Vermieter not found' });
    }

    // Create negotiation record
    const negId = `neg_${uuidv4().slice(0, 8)}`;
    db.prepare(`
      INSERT INTO negotiations (id, candidate_id, vermieter_id, housing_id, status, call_attempts)
      VALUES (?, ?, ?, ?, 'calling', 1)
    `).run(negId, candidate_id, vermieter_id, housing_id);

    // Prepare message for Cloud-Agents
    const callMessage = `
Aufgabe: Rufe ${vermieter.name} an (${vermieter.phone}) wegen Monteurzimmer.

Kandidat: ${candidate.name}
Arbeitgeber: ${candidate.employer || 'ATU'}
Budget: bis ${candidate.budget_max}€/Monat
Einzug: ${candidate.move_in_date || 'so bald wie möglich'}
${housing ? `\nWohnung: ${housing.title} - ${housing.price_monthly}€/Monat` : ''}

Verhandle freundlich aber bestimmt. Ziel: Mietvertrag mit Anmeldemöglichkeit.
Speichere das Ergebnis über die MCP-API.
    `.trim();

    // Send to Cloud-Agents (if configured)
    let agentResponse = null;
    if (process.env.CLOUD_AGENTS_TOKEN) {
      try {
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(`${CLOUD_AGENTS_URL}/api/chat/${agent_name || 'relocation'}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.CLOUD_AGENTS_TOKEN}`
          },
          body: JSON.stringify({
            message: callMessage,
            context: { negotiation_id: negId, candidate, vermieter, housing }
          })
        });
        agentResponse = await response.json();
      } catch (e) {
        console.error('Cloud-Agents call failed:', e.message);
      }
    }

    res.json({
      success: true,
      negotiation_id: negId,
      message: 'Anruf-Auftrag erstellt',
      agent_response: agentResponse,
      call_details: {
        vermieter: vermieter.name,
        phone: vermieter.phone,
        candidate: candidate.name,
        housing: housing?.title
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Auto-search and create negotiations for a candidate
app.post('/v1/agents/search-housing', (req, res) => {
  try {
    const { candidate_id, auto_negotiate } = req.body;

    if (!candidate_id) return res.status(400).json({ error: 'candidate_id required' });

    const candidate = db.prepare('SELECT * FROM candidates WHERE id = ?').get(candidate_id);
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

    // Create relocation request
    const relId = `rel_${uuidv4().slice(0, 8)}`;
    const requirements = {
      city: candidate.preferred_city || 'München',
      budget_max: candidate.budget_max || 800,
      family_size: candidate.family_size || 1,
      needs_mietvertrag: candidate.needs_mietvertrag === 1,
      needs_anmeldung: candidate.needs_anmeldung === 1
    };

    db.prepare(`
      INSERT INTO relocation_requests (id, candidate_id, requirements, status, assigned_agent, started_at)
      VALUES (?, ?, ?, 'searching', 'lead_ai', datetime('now'))
    `).run(relId, candidate_id, JSON.stringify(requirements));

    // Find matching housing
    const housing = findMatchingHousing(requirements);

    // Update with matched housing
    db.prepare('UPDATE relocation_requests SET matched_housing = ?, status = ? WHERE id = ?')
      .run(JSON.stringify(housing.map(h => h.id)), housing.length > 0 ? 'negotiating' : 'searching', relId);

    // Create negotiations if auto_negotiate
    const negotiations = [];
    if (auto_negotiate && housing.length > 0) {
      for (const h of housing.slice(0, 3)) { // Top 3
        const negId = `neg_${uuidv4().slice(0, 8)}`;
        db.prepare(`
          INSERT INTO negotiations (id, relocation_request_id, candidate_id, vermieter_id, housing_id, offered_price, status)
          VALUES (?, ?, ?, ?, ?, ?, 'pending')
        `).run(negId, relId, candidate_id, h.vermieter_id, h.id, h.price_monthly);
        negotiations.push({ id: negId, housing: h });
      }
    }

    res.json({
      success: true,
      relocation_request_id: relId,
      matched_count: housing.length,
      matched_housing: housing,
      negotiations: negotiations,
      next_step: auto_negotiate ? 'Verhandlungen wurden erstellt - Relocation Agent kann anrufen' : 'Passende Wohnungen gefunden'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// DASHBOARD STATS (extended)
// ============================================================================

app.get('/v1/dashboard/stats', (req, res) => {
  try {
    const campaigns = db.prepare(`
      SELECT COUNT(*) as total, SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active
      FROM campaigns
    `).get();

    const leads = db.prepare(`
      SELECT COUNT(*) as total, SUM(CASE WHEN status = 'converted' THEN 1 ELSE 0 END) as converted
      FROM leads
    `).get();

    const candidates = db.prepare(`
      SELECT COUNT(*) as total,
        SUM(CASE WHEN status = 'searching' THEN 1 ELSE 0 END) as searching,
        SUM(CASE WHEN status = 'found' THEN 1 ELSE 0 END) as found,
        SUM(CASE WHEN status = 'moved_in' THEN 1 ELSE 0 END) as moved_in
      FROM candidates
    `).get();

    const housing = db.prepare(`
      SELECT COUNT(*) as total,
        SUM(CASE WHEN is_available = 1 THEN 1 ELSE 0 END) as available,
        AVG(price_monthly) as avg_price
      FROM housing
    `).get();

    const negotiations = db.prepare(`
      SELECT COUNT(*) as total,
        SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
      FROM negotiations
    `).get();

    const deals = db.prepare(`
      SELECT COUNT(*) as total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active
      FROM deals
    `).get();

    res.json({
      campaigns,
      leads,
      candidates,
      housing: { ...housing, avg_price: housing.avg_price?.toFixed(2) || 0 },
      negotiations,
      deals,
      success_rate: negotiations.total > 0 ? ((negotiations.accepted / negotiations.total) * 100).toFixed(2) : 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Lead Builder v3.0 + ATU Relocation] http://0.0.0.0:${PORT}`);
  console.log(`[Health] http://localhost:${PORT}/health`);
  console.log(`[API Docs] http://localhost:${PORT}/api`);
});
