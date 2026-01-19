import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";
import { registerScraperTools } from "./scraper-tools.js";
import { registerAuthTools } from "./auth-tools.js";
import { registerCallTools } from "./call-tools.js";
import { registerCallSystemTools } from "./call-system.js";
import { registerHousecallTools } from "./housecall-tools.js";
import { registerAIAgentTools } from "./ai-agent-tools.js";

const execAsync = promisify(exec);

// ============================================
// CONFIGURATION
// ============================================

// Lead Builder Backend
const LB_BACKEND_BASE = process.env.LB_BACKEND_BASE ?? "http://49.13.144.44:3003";

// Cloud Agents Backend
const CA_BACKEND_BASE = process.env.CA_BACKEND_BASE ?? "http://178.156.178.70:3001";

// Master Brain Backend
const MB_BACKEND_BASE = process.env.MB_BACKEND_BASE ?? "http://178.156.178.70:3002";

// SSH Configuration for Lead Builder Server
const LB_SSH_KEY = process.env.LB_SSH_KEY ?? "~/.ssh/id_ed25519_cloudagents";
const LB_SSH_HOST = process.env.LB_SSH_HOST ?? "root@49.13.144.44";

// SSH Configuration for Cloud Agents Server
const CA_SSH_KEY = process.env.CA_SSH_KEY ?? "~/.ssh/id_ed25519_cloudagents";
const CA_SSH_HOST = process.env.CA_SSH_HOST ?? "root@178.156.178.70";

// ============================================
// HELPER FUNCTIONS
// ============================================

async function httpJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  return { ok: res.ok, status: res.status, data };
}

async function sshExec(command: string, sshKey: string, sshHost: string): Promise<{ ok: boolean; stdout: string; stderr: string }> {
  try {
    const { stdout, stderr } = await execAsync(
      `ssh -i ${sshKey} -o StrictHostKeyChecking=accept-new ${sshHost} "${command.replace(/"/g, '\\"')}"`,
      { timeout: 30000 }
    );
    return { ok: true, stdout: stdout.trim(), stderr: stderr.trim() };
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string; message?: string };
    return { ok: false, stdout: e.stdout ?? "", stderr: e.stderr ?? e.message ?? "Unknown error" };
  }
}

// ============================================
// MCP SERVER
// ============================================

const server = new McpServer({
  name: "lead-ai-housefinder-mcp",
  version: "3.0.0",
});

// ============================================
// REGISTER AUTH TOOLS (auth_*)
// ============================================

registerAuthTools(server);

// ============================================
// REGISTER SCRAPER TOOLS (scraper_*)
// ============================================

registerScraperTools(server);

// Register Call Tools (Vonage, Sipgate, Make.com)
registerCallTools(server);

// Register Call System Tools (Triggers, Queue, History, Retry)
registerCallSystemTools(server);

// Register Housecall Agent Tools (TTS, IVR, Recording, DTMF)
registerHousecallTools(server);

// Register AI Agent Tools (Multi-Provider TTS, LLM, Conversations)
registerAIAgentTools(server);

// ============================================
// LEAD BUILDER TOOLS (lb_*)
// ============================================

server.tool(
  "lb_health",
  { baseUrl: z.string().optional().describe("Override backend base url") },
  async ({ baseUrl }) => {
    const base = baseUrl ?? LB_BACKEND_BASE;
    const out = await httpJson(`${base}/health`);
    return { content: [{ type: "text", text: JSON.stringify({ base, ...out }, null, 2) }] };
  }
);

server.tool(
  "lb_stats",
  { baseUrl: z.string().optional() },
  async ({ baseUrl }) => {
    const out = await httpJson(`${baseUrl ?? LB_BACKEND_BASE}/v1/dashboard/stats`);
    return { content: [{ type: "text", text: JSON.stringify(out, null, 2) }] };
  }
);

server.tool(
  "lb_campaigns",
  {
    status: z.enum(["active", "paused", "completed", "archived"]).optional(),
    priority: z.enum(["urgent", "high", "normal", "low"]).optional(),
    baseUrl: z.string().optional(),
  },
  async ({ status, priority, baseUrl }) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (priority) params.set("priority", priority);
    const out = await httpJson(`${baseUrl ?? LB_BACKEND_BASE}/v1/campaigns${params.toString() ? "?" + params : ""}`);
    return { content: [{ type: "text", text: JSON.stringify(out, null, 2) }] };
  }
);

server.tool(
  "lb_campaign_create",
  {
    name: z.string(),
    target_type: z.enum(["lead_campaign", "job_posting", "call_list"]),
    description: z.string().optional(),
    priority: z.enum(["urgent", "high", "normal", "low"]).optional(),
    target_count: z.number().optional(),
    baseUrl: z.string().optional(),
  },
  async ({ name, target_type, description, priority, target_count, baseUrl }) => {
    const body = { name, target_type, description, priority, target_count };
    const out = await httpJson(`${baseUrl ?? LB_BACKEND_BASE}/v1/campaigns`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return { content: [{ type: "text", text: JSON.stringify(out, null, 2) }] };
  }
);

server.tool(
  "lb_campaign_stats",
  { id: z.string(), baseUrl: z.string().optional() },
  async ({ id, baseUrl }) => {
    const out = await httpJson(`${baseUrl ?? LB_BACKEND_BASE}/v1/campaigns/${id}/stats`);
    return { content: [{ type: "text", text: JSON.stringify(out, null, 2) }] };
  }
);

server.tool(
  "lb_leads",
  {
    campaign_id: z.string().optional(),
    status: z.enum(["new", "contacted", "responded", "qualified", "converted", "rejected"]).optional(),
    quality: z.enum(["hot", "warm", "cold", "unknown"]).optional(),
    limit: z.number().optional(),
    offset: z.number().optional(),
    baseUrl: z.string().optional(),
  },
  async ({ campaign_id, status, quality, limit, offset, baseUrl }) => {
    const params = new URLSearchParams();
    if (campaign_id) params.set("campaign_id", campaign_id);
    if (status) params.set("status", status);
    if (quality) params.set("quality", quality);
    if (limit) params.set("limit", String(limit));
    if (offset) params.set("offset", String(offset));
    const out = await httpJson(`${baseUrl ?? LB_BACKEND_BASE}/v1/leads${params.toString() ? "?" + params : ""}`);
    return { content: [{ type: "text", text: JSON.stringify(out, null, 2) }] };
  }
);

server.tool(
  "lb_lead_create",
  {
    campaign_id: z.string().optional(),
    name: z.string().optional(),
    company: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    position: z.string().optional(),
    location: z.string().optional(),
    source: z.enum(["manual", "scraper", "import", "api"]).optional(),
    baseUrl: z.string().optional(),
  },
  async ({ campaign_id, name, company, email, phone, position, location, source, baseUrl }) => {
    const body = { campaign_id, name, company, email, phone, position, location, source: source ?? "manual" };
    const out = await httpJson(`${baseUrl ?? LB_BACKEND_BASE}/v1/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return { content: [{ type: "text", text: JSON.stringify(out, null, 2) }] };
  }
);

server.tool(
  "lb_communications",
  {
    lead_id: z.string().optional(),
    campaign_id: z.string().optional(),
    channel: z.enum(["email", "whatsapp", "phone", "linkedin"]).optional(),
    limit: z.number().optional(),
    baseUrl: z.string().optional(),
  },
  async ({ lead_id, campaign_id, channel, limit, baseUrl }) => {
    const params = new URLSearchParams();
    if (lead_id) params.set("lead_id", lead_id);
    if (campaign_id) params.set("campaign_id", campaign_id);
    if (channel) params.set("channel", channel);
    if (limit) params.set("limit", String(limit));
    const out = await httpJson(`${baseUrl ?? LB_BACKEND_BASE}/v1/communications${params.toString() ? "?" + params : ""}`);
    return { content: [{ type: "text", text: JSON.stringify(out, null, 2) }] };
  }
);

server.tool(
  "lb_sources",
  { baseUrl: z.string().optional() },
  async ({ baseUrl }) => {
    const out = await httpJson(`${baseUrl ?? LB_BACKEND_BASE}/v1/sources`);
    return { content: [{ type: "text", text: JSON.stringify(out, null, 2) }] };
  }
);

server.tool(
  "lb_templates",
  { type: z.string().optional(), baseUrl: z.string().optional() },
  async ({ type, baseUrl }) => {
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    const out = await httpJson(`${baseUrl ?? LB_BACKEND_BASE}/v1/templates${params.toString() ? "?" + params : ""}`);
    return { content: [{ type: "text", text: JSON.stringify(out, null, 2) }] };
  }
);

// ============================================
// LEAD BUILDER SSH/DEPLOY TOOLS (lb_pm2_*, lb_deploy, lb_db_query, lb_server_stats)
// ============================================

server.tool(
  "lb_pm2_status",
  {
    format: z.enum(["table", "json"]).optional().describe("Output format (default: table)"),
  },
  async ({ format }) => {
    const cmd = format === "json" ? "pm2 jlist" : "pm2 status";
    const out = await sshExec(cmd, LB_SSH_KEY, LB_SSH_HOST);
    return { content: [{ type: "text", text: JSON.stringify({ command: cmd, ...out }, null, 2) }] };
  }
);

server.tool(
  "lb_pm2_logs",
  {
    process: z.enum(["lead-builder-backend", "lead-builder-frontend", "all"]).optional().describe("Process name (default: all)"),
    lines: z.number().optional().describe("Number of lines (default: 50)"),
    err: z.boolean().optional().describe("Show only error logs"),
  },
  async ({ process: proc, lines, err }) => {
    const n = lines ?? 50;
    const procName = proc ?? "all";
    const errFlag = err ? "--err" : "";
    const cmd = `pm2 logs ${procName} --nostream --lines ${n} ${errFlag}`.trim();
    const out = await sshExec(cmd, LB_SSH_KEY, LB_SSH_HOST);
    return { content: [{ type: "text", text: JSON.stringify({ command: cmd, ...out }, null, 2) }] };
  }
);

server.tool(
  "lb_deploy",
  {
    project: z.enum(["backend", "frontend", "both"]).describe("Which project to deploy"),
    restart: z.boolean().optional().describe("Restart PM2 after deploy (default: true)"),
  },
  async ({ project, restart }) => {
    const shouldRestart = restart !== false;
    const results: { project: string; out: Awaited<ReturnType<typeof sshExec>> }[] = [];

    if (project === "backend" || project === "both") {
      let cmd = `cd /root/lead-builder-backend && git pull origin main && npm install`;
      if (shouldRestart) cmd += ` && pm2 restart lead-builder-backend`;
      const out = await sshExec(cmd, LB_SSH_KEY, LB_SSH_HOST);
      results.push({ project: "backend", out });
    }

    if (project === "frontend" || project === "both") {
      let cmd = `cd /root/lead-builder-frontend && git pull origin main && npm install && npm run build`;
      if (shouldRestart) cmd += ` && pm2 restart lead-builder-frontend`;
      const out = await sshExec(cmd, LB_SSH_KEY, LB_SSH_HOST);
      results.push({ project: "frontend", out });
    }

    return { content: [{ type: "text", text: JSON.stringify({ results }, null, 2) }] };
  }
);

server.tool(
  "lb_db_query",
  {
    query: z.string().min(1).describe("SQL query (SELECT only)"),
  },
  async ({ query }) => {
    const upperQuery = query.trim().toUpperCase();
    if (!upperQuery.startsWith("SELECT")) {
      return { content: [{ type: "text", text: JSON.stringify({ ok: false, error: "Only SELECT queries allowed" }, null, 2) }] };
    }

    const db = "/root/lead-builder-backend/data/lead-builder.db";
    const escapedQuery = query.replace(/"/g, '\\"');
    const cmd = `sqlite3 -header -column "${db}" "${escapedQuery}"`;
    const out = await sshExec(cmd, LB_SSH_KEY, LB_SSH_HOST);
    return { content: [{ type: "text", text: JSON.stringify({ command: "lb_db_query", query, ...out }, null, 2) }] };
  }
);

server.tool(
  "lb_server_stats",
  {},
  async () => {
    const cmd = `echo "=== DISK ===" && df -h / && echo "\\n=== MEMORY ===" && free -h && echo "\\n=== CPU ===" && top -bn1 | head -5`;
    const out = await sshExec(cmd, LB_SSH_KEY, LB_SSH_HOST);
    return { content: [{ type: "text", text: JSON.stringify({ tool: "lb_server_stats", ...out }, null, 2) }] };
  }
);

// ============================================
// CLOUD AGENTS TOOLS (ca_*)
// ============================================

server.tool(
  "ca_health",
  { baseUrl: z.string().optional() },
  async ({ baseUrl }) => {
    const base = baseUrl ?? CA_BACKEND_BASE;
    const out = await httpJson(`${base}/health`);
    return { content: [{ type: "text", text: JSON.stringify({ base, ...out }, null, 2) }] };
  }
);

server.tool(
  "ca_agents_status",
  { token: z.string().optional(), baseUrl: z.string().optional() },
  async ({ token, baseUrl }) => {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const out = await httpJson(`${baseUrl ?? CA_BACKEND_BASE}/api/agents/status`, { headers });
    return { content: [{ type: "text", text: JSON.stringify(out, null, 2) }] };
  }
);

server.tool(
  "ca_tasks_list",
  {
    token: z.string().optional(),
    state: z.string().optional(),
    baseUrl: z.string().optional(),
  },
  async ({ token, state, baseUrl }) => {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const params = new URLSearchParams();
    if (state) params.set("state", state);
    const out = await httpJson(`${baseUrl ?? CA_BACKEND_BASE}/api/tasks${params.toString() ? "?" + params : ""}`, { headers });
    return { content: [{ type: "text", text: JSON.stringify(out, null, 2) }] };
  }
);

server.tool(
  "ca_chat_send",
  {
    token: z.string(),
    agentName: z.string(),
    message: z.string(),
    baseUrl: z.string().optional(),
  },
  async ({ token, agentName, message, baseUrl }) => {
    const out = await httpJson(`${baseUrl ?? CA_BACKEND_BASE}/api/chat/${agentName}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ message }),
    });
    return { content: [{ type: "text", text: JSON.stringify(out, null, 2) }] };
  }
);

server.tool(
  "ca_brain_search",
  {
    token: z.string(),
    query: z.string(),
    limit: z.number().optional(),
    mode: z.enum(["semantic", "keyword", "hybrid"]).optional(),
    baseUrl: z.string().optional(),
  },
  async ({ token, query, limit, mode, baseUrl }) => {
    const params = new URLSearchParams();
    params.set("q", query);
    if (limit) params.set("limit", String(limit));
    if (mode) params.set("mode", mode);
    const out = await httpJson(`${baseUrl ?? CA_BACKEND_BASE}/api/brain/search?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return { content: [{ type: "text", text: JSON.stringify(out, null, 2) }] };
  }
);

server.tool(
  "ca_brain_ingest",
  {
    token: z.string(),
    title: z.string(),
    content: z.string(),
    tags: z.array(z.string()).optional(),
    baseUrl: z.string().optional(),
  },
  async ({ token, title, content, tags, baseUrl }) => {
    const out = await httpJson(`${baseUrl ?? CA_BACKEND_BASE}/api/brain/ingest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title, content, tags }),
    });
    return { content: [{ type: "text", text: JSON.stringify(out, null, 2) }] };
  }
);

server.tool(
  "ca_brain_stats",
  { token: z.string(), baseUrl: z.string().optional() },
  async ({ token, baseUrl }) => {
    const out = await httpJson(`${baseUrl ?? CA_BACKEND_BASE}/api/brain/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return { content: [{ type: "text", text: JSON.stringify(out, null, 2) }] };
  }
);

// ============================================
// CLOUD AGENTS AUDIT TOOLS (ca_audit_*, ca_ops_*)
// ============================================

server.tool(
  "ca_audit_events_list",
  {
    token: z.string().min(10).describe("JWT access token (Bearer)"),
    kind: z.string().optional().describe("Filter by event kind (e.g. user_login, task_created, brain_search)"),
    severity: z.enum(["info", "warn", "error"]).optional().describe("Filter by severity"),
    since: z.string().optional().describe("ISO date string - get events since this time"),
    limit: z.number().optional().describe("Max events to return (default: 50, max: 500)"),
    baseUrl: z.string().optional().describe("Override backend base url"),
  },
  async ({ token, kind, severity, since, limit, baseUrl }) => {
    const params = new URLSearchParams();
    if (kind) params.set("kind", kind);
    if (severity) params.set("severity", severity);
    if (since) params.set("since", since);
    if (limit) params.set("limit", String(limit));
    const out = await httpJson(`${baseUrl ?? CA_BACKEND_BASE}/api/audit/events${params.toString() ? "?" + params : ""}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return { content: [{ type: "text", text: JSON.stringify(out, null, 2) }] };
  }
);

server.tool(
  "ca_audit_events_stats",
  {
    token: z.string().min(10).describe("JWT access token (Bearer) - requires admin role"),
    baseUrl: z.string().optional().describe("Override backend base url"),
  },
  async ({ token, baseUrl }) => {
    const out = await httpJson(`${baseUrl ?? CA_BACKEND_BASE}/api/audit/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return { content: [{ type: "text", text: JSON.stringify(out, null, 2) }] };
  }
);

server.tool(
  "ca_ops_events",
  {
    kind: z.string().optional().describe("Filter by event kind (e.g. user_login, deploy, chat_sent)"),
    severity: z.enum(["info", "warn", "error"]).optional().describe("Filter by severity"),
    limit: z.number().optional().describe("Max events (default: 20)"),
  },
  async ({ kind, severity, limit }) => {
    const params = new URLSearchParams();
    if (kind) params.set("kind", kind);
    if (severity) params.set("severity", severity);
    if (limit) params.set("limit", String(limit));
    const out = await httpJson(`${CA_BACKEND_BASE}/api/ops/events${params.toString() ? "?" + params : ""}`);
    return { content: [{ type: "text", text: JSON.stringify(out, null, 2) }] };
  }
);

server.tool(
  "ca_ops_tasks_history",
  {
    status: z.string().optional().describe("Filter by status (pending, in_progress, completed, stopped)"),
    limit: z.number().optional().describe("Max tasks (default: 20)"),
  },
  async ({ status, limit }) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (limit) params.set("limit", String(limit));
    const out = await httpJson(`${CA_BACKEND_BASE}/api/ops/tasks${params.toString() ? "?" + params : ""}`);
    return { content: [{ type: "text", text: JSON.stringify(out, null, 2) }] };
  }
);

server.tool(
  "ca_ops_stats",
  {},
  async () => {
    const out = await httpJson(`${CA_BACKEND_BASE}/api/ops/stats`);
    return { content: [{ type: "text", text: JSON.stringify(out, null, 2) }] };
  }
);

// ============================================
// CLOUD AGENTS PM2/DEPLOY TOOLS (ca_pm2_*, ca_deploy, ca_db_query, ca_server_stats)
// ============================================

server.tool(
  "ca_pm2_status",
  {
    format: z.enum(["table", "json"]).optional().describe("Output format (default: table)"),
  },
  async ({ format }) => {
    const cmd = format === "json" ? "pm2 jlist" : "pm2 status";
    const out = await sshExec(cmd, CA_SSH_KEY, CA_SSH_HOST);
    return { content: [{ type: "text", text: JSON.stringify({ command: cmd, ...out }, null, 2) }] };
  }
);

server.tool(
  "ca_pm2_logs",
  {
    process: z.string().optional().describe("Process name or id (default: all)"),
    lines: z.number().optional().describe("Number of lines (default: 50)"),
    err: z.boolean().optional().describe("Show only error logs"),
  },
  async ({ process: proc, lines, err }) => {
    const n = lines ?? 50;
    const procName = proc ?? "all";
    const errFlag = err ? "--err" : "";
    const cmd = `pm2 logs ${procName} --nostream --lines ${n} ${errFlag}`.trim();
    const out = await sshExec(cmd, CA_SSH_KEY, CA_SSH_HOST);
    return { content: [{ type: "text", text: JSON.stringify({ command: cmd, ...out }, null, 2) }] };
  }
);

server.tool(
  "ca_deploy",
  {
    project: z.enum(["cloud-agents", "admin-dashboard"]).describe("Project to deploy"),
    restart: z.boolean().optional().describe("Restart PM2 after pull (default: true)"),
  },
  async ({ project, restart }) => {
    const shouldRestart = restart !== false;
    let cmd = "";

    if (project === "cloud-agents") {
      cmd = `cd /root/cloud-agents && git pull origin main && npm install`;
      if (shouldRestart) cmd += ` && pm2 restart cloud-agents`;
    } else if (project === "admin-dashboard") {
      cmd = `cd /root/admin-dashboard && git pull origin main && npm install && npm run build`;
      if (shouldRestart) cmd += ` && pm2 restart admin-dashboard`;
    }

    const out = await sshExec(cmd, CA_SSH_KEY, CA_SSH_HOST);
    return { content: [{ type: "text", text: JSON.stringify({ project, ...out }, null, 2) }] };
  }
);

server.tool(
  "ca_db_query",
  {
    query: z.string().min(1).describe("SQL query (SELECT only)"),
    database: z.string().optional().describe("Database file path (default: /root/cloud-agents/data/app.sqlite)"),
  },
  async ({ query, database }) => {
    const upperQuery = query.trim().toUpperCase();
    if (!upperQuery.startsWith("SELECT")) {
      return { content: [{ type: "text", text: JSON.stringify({ ok: false, error: "Only SELECT queries allowed" }, null, 2) }] };
    }

    const db = database ?? "/root/cloud-agents/data/app.sqlite";
    const escapedQuery = query.replace(/"/g, '\\"');
    const cmd = `sqlite3 -header -column "${db}" "${escapedQuery}"`;
    const out = await sshExec(cmd, CA_SSH_KEY, CA_SSH_HOST);
    return { content: [{ type: "text", text: JSON.stringify({ command: "ca_db_query", query, ...out }, null, 2) }] };
  }
);

server.tool(
  "ca_server_stats",
  {},
  async () => {
    const cmd = `echo "=== DISK ===" && df -h / && echo "\\n=== MEMORY ===" && free -h && echo "\\n=== CPU ===" && top -bn1 | head -5`;
    const out = await sshExec(cmd, CA_SSH_KEY, CA_SSH_HOST);
    return { content: [{ type: "text", text: JSON.stringify({ tool: "ca_server_stats", ...out }, null, 2) }] };
  }
);

// ============================================
// MASTER BRAIN TOOLS (mb_*)
// ============================================

server.tool(
  "mb_health",
  { baseUrl: z.string().optional().describe("Override backend base url") },
  async ({ baseUrl }) => {
    const base = baseUrl ?? MB_BACKEND_BASE;
    const out = await httpJson(`${base}/health`);
    return { content: [{ type: "text", text: JSON.stringify({ base, ...out }, null, 2) }] };
  }
);

server.tool(
  "mb_search",
  {
    token: z.string().min(10).describe("JWT access token (Bearer) - userId is extracted from JWT"),
    query: z.string().min(1).describe("Search query"),
    limit: z.number().optional().describe("Max results (default: 10)"),
    mode: z.enum(["semantic", "keyword", "hybrid"]).optional().describe("Search mode (default: hybrid)"),
    baseUrl: z.string().optional().describe("Override backend base url"),
  },
  async ({ token, query, limit, mode, baseUrl }) => {
    const params = new URLSearchParams();
    params.set("q", query);
    if (limit) params.set("limit", String(limit));
    if (mode) params.set("mode", mode);
    const out = await httpJson(`${baseUrl ?? MB_BACKEND_BASE}/api/brain/search?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return { content: [{ type: "text", text: JSON.stringify(out, null, 2) }] };
  }
);

server.tool(
  "mb_save",
  {
    token: z.string().min(10).describe("JWT access token (Bearer) - userId is extracted from JWT"),
    title: z.string().min(1).describe("Document title"),
    content: z.string().min(1).describe("Text content to save"),
    tags: z.array(z.string()).optional().describe("Optional tags for categorization"),
    baseUrl: z.string().optional().describe("Override backend base url"),
  },
  async ({ token, title, content, tags, baseUrl }) => {
    const out = await httpJson(`${baseUrl ?? MB_BACKEND_BASE}/api/brain/ingest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title, content, tags }),
    });
    return { content: [{ type: "text", text: JSON.stringify(out, null, 2) }] };
  }
);

server.tool(
  "mb_stats",
  {
    token: z.string().min(10).describe("JWT access token (Bearer) - userId is extracted from JWT"),
    baseUrl: z.string().optional().describe("Override backend base url"),
  },
  async ({ token, baseUrl }) => {
    const out = await httpJson(`${baseUrl ?? MB_BACKEND_BASE}/api/brain/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return { content: [{ type: "text", text: JSON.stringify(out, null, 2) }] };
  }
);

server.tool(
  "mb_recent",
  {
    token: z.string().min(10).describe("JWT access token (Bearer)"),
    limit: z.number().optional().describe("Max entries (default: 20)"),
    baseUrl: z.string().optional().describe("Override backend base url"),
  },
  async ({ token, limit, baseUrl }) => {
    const params = new URLSearchParams();
    if (limit) params.set("limit", String(limit));
    const out = await httpJson(`${baseUrl ?? MB_BACKEND_BASE}/api/brain/recent${params.toString() ? "?" + params : ""}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return { content: [{ type: "text", text: JSON.stringify(out, null, 2) }] };
  }
);

server.tool(
  "mb_auto_memory_status",
  {
    token: z.string().min(10).describe("JWT access token (Bearer)"),
    baseUrl: z.string().optional().describe("Override backend base url"),
  },
  async ({ token, baseUrl }) => {
    const out = await httpJson(`${baseUrl ?? MB_BACKEND_BASE}/api/auto-memory/status`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return { content: [{ type: "text", text: JSON.stringify(out, null, 2) }] };
  }
);

server.tool(
  "mb_auto_memory_config",
  {
    token: z.string().min(10).describe("JWT access token (Bearer)"),
    enabled: z.boolean().optional().describe("Enable/disable auto-memory"),
    trigger_keywords: z.array(z.string()).optional().describe("Keywords that trigger auto-save"),
    exclude_patterns: z.array(z.string()).optional().describe("Patterns to exclude from auto-save"),
    baseUrl: z.string().optional().describe("Override backend base url"),
  },
  async ({ token, enabled, trigger_keywords, exclude_patterns, baseUrl }) => {
    const body: Record<string, unknown> = {};
    if (enabled !== undefined) body.enabled = enabled;
    if (trigger_keywords) body.trigger_keywords = trigger_keywords;
    if (exclude_patterns) body.exclude_patterns = exclude_patterns;

    const out = await httpJson(`${baseUrl ?? MB_BACKEND_BASE}/api/auto-memory/config`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    return { content: [{ type: "text", text: JSON.stringify(out, null, 2) }] };
  }
);

// ============================================
// SERVER OPS TOOLS (ops_*)
// ============================================

server.tool(
  "ops_pm2_status",
  { format: z.enum(["table", "json"]).optional() },
  async ({ format }) => {
    try {
      const { stdout } = await execAsync(`pm2 jlist`);
      const processes = JSON.parse(stdout);
      if (format === "json") {
        return { content: [{ type: "text", text: JSON.stringify(processes, null, 2) }] };
      }
      const table = processes.map((p: any) => ({
        name: p.name,
        status: p.pm2_env?.status,
        cpu: p.monit?.cpu,
        memory: `${Math.round((p.monit?.memory || 0) / 1024 / 1024)}MB`,
        uptime: p.pm2_env?.pm_uptime ? `${Math.round((Date.now() - p.pm2_env.pm_uptime) / 1000 / 60)}m` : '-',
      }));
      return { content: [{ type: "text", text: JSON.stringify(table, null, 2) }] };
    } catch (e) {
      return { content: [{ type: "text", text: `Error: ${e}` }] };
    }
  }
);

server.tool(
  "ops_pm2_logs",
  {
    process: z.string().optional(),
    lines: z.number().optional(),
    err: z.boolean().optional(),
  },
  async ({ process: proc, lines, err }) => {
    try {
      const cmd = `pm2 logs ${proc || ""} --lines ${lines || 50} --nostream ${err ? "--err" : ""}`;
      const { stdout, stderr } = await execAsync(cmd);
      return { content: [{ type: "text", text: stdout + stderr }] };
    } catch (e) {
      return { content: [{ type: "text", text: `Error: ${e}` }] };
    }
  }
);

server.tool(
  "ops_server_stats",
  {},
  async () => {
    try {
      const { stdout } = await execAsync(`
        echo "=== DISK ===" && df -h / | tail -1 &&
        echo "=== MEMORY ===" && free -h | head -2 &&
        echo "=== LOAD ===" && uptime
      `);
      return { content: [{ type: "text", text: stdout }] };
    } catch (e) {
      return { content: [{ type: "text", text: `Error: ${e}` }] };
    }
  }
);

// ============================================
// START SERVER
// ============================================

async function main() {
  console.error("[MCP] Lead AI Housefinder MCP Server v3.0.0 starting...");
  console.error("[MCP] 87 Tools available:");
  console.error("[MCP]   - auth_* (6): Authentication & Authorization");
  console.error("[MCP]   - scraper_* (5): Web Scraping with Stealth");
  console.error("[MCP]   - call_* (8): Vonage, Sipgate, Make.com");
  console.error("[MCP]   - trigger_*/queue_*/history_*/retry_* (12): Call System");
  console.error("[MCP]   - housecall_* (11): TTS, IVR, Recording, DTMF");
  console.error("[MCP]   - ai_* (9): OpenAI/Claude/Azure LLM + Multi-TTS");
  console.error("[MCP]   - lb_* (15): Lead Builder + SSH/Deploy");
  console.error("[MCP]   - ca_* (14): Cloud Agents + Audit + SSH/Deploy");
  console.error("[MCP]   - mb_* (7): Master Brain + Auto-Memory");

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("[MCP] Server connected via stdio");
}

main().catch((err) => {
  console.error("[MCP] Fatal error:", err);
  process.exit(1);
});
