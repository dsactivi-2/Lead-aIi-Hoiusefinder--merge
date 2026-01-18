import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// ============================================
// CONFIGURATION
// ============================================

// Lead Builder Backend
const LB_BACKEND_BASE = process.env.LB_BACKEND_BASE ?? "http://49.13.144.44:3003";
const LB_SSH_HOST = process.env.LB_SSH_HOST ?? "root@49.13.144.44";

// Cloud Agents Backend
const CA_BACKEND_BASE = process.env.CA_BACKEND_BASE ?? "http://178.156.178.70:3001";
const CA_SSH_HOST = process.env.CA_SSH_HOST ?? "root@178.156.178.70";

// Shared
const SSH_KEY = process.env.SSH_KEY ?? "~/.ssh/id_ed25519_cloudagents";

// ============================================
// HELPER FUNCTIONS
// ============================================

async function sshExec(host: string, command: string): Promise<{ ok: boolean; stdout: string; stderr: string }> {
  try {
    const { stdout, stderr } = await execAsync(
      `ssh -i ${SSH_KEY} -o StrictHostKeyChecking=accept-new ${host} "${command.replace(/"/g, '\\"')}"`,
      { timeout: 30000 }
    );
    return { ok: true, stdout: stdout.trim(), stderr: stderr.trim() };
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string; message?: string };
    return { ok: false, stdout: e.stdout ?? "", stderr: e.stderr ?? e.message ?? "Unknown error" };
  }
}

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

// ============================================
// MCP SERVER
// ============================================

const server = new McpServer({
  name: "lead-ai-housefinder-mcp",
  version: "1.0.0",
});

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
  "lb_pm2_status",
  { format: z.enum(["table", "json"]).optional().describe("Output format (default: table)") },
  async ({ format }) => {
    const cmd = format === "json" ? "pm2 jlist" : "pm2 status";
    const out = await sshExec(LB_SSH_HOST, cmd);
    return { content: [{ type: "text", text: JSON.stringify({ command: cmd, ...out }, null, 2) }] };
  }
);

server.tool(
  "lb_pm2_logs",
  {
    process: z.enum(["lead-builder-backend", "lead-builder-frontend", "all"]).optional(),
    lines: z.number().optional(),
    err: z.boolean().optional(),
  },
  async ({ process, lines, err }) => {
    const cmd = `pm2 logs ${process ?? "all"} --nostream --lines ${lines ?? 50} ${err ? "--err" : ""}`.trim();
    const out = await sshExec(LB_SSH_HOST, cmd);
    return { content: [{ type: "text", text: JSON.stringify({ command: cmd, ...out }, null, 2) }] };
  }
);

server.tool(
  "lb_deploy",
  {
    project: z.enum(["backend", "frontend", "both"]).describe("Which project to deploy"),
    restart: z.boolean().optional(),
  },
  async ({ project, restart }) => {
    const results: { project: string; out: Awaited<ReturnType<typeof sshExec>> }[] = [];
    if (project === "backend" || project === "both") {
      let cmd = `cd /root/lead-builder-backend && git pull origin main && npm install`;
      if (restart !== false) cmd += ` && pm2 restart lead-builder-backend`;
      results.push({ project: "backend", out: await sshExec(LB_SSH_HOST, cmd) });
    }
    if (project === "frontend" || project === "both") {
      let cmd = `cd /root/lead-builder-frontend && git pull origin main && npm install && npm run build`;
      if (restart !== false) cmd += ` && pm2 restart lead-builder-frontend`;
      results.push({ project: "frontend", out: await sshExec(LB_SSH_HOST, cmd) });
    }
    return { content: [{ type: "text", text: JSON.stringify({ results }, null, 2) }] };
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
    name: z.string().min(1),
    target_type: z.enum(["lead_campaign", "job_posting", "call_list"]),
    description: z.string().optional(),
    priority: z.enum(["urgent", "high", "normal", "low"]).optional(),
    target_count: z.number().optional(),
    baseUrl: z.string().optional(),
  },
  async ({ name, target_type, description, priority, target_count, baseUrl }) => {
    const out = await httpJson(`${baseUrl ?? LB_BACKEND_BASE}/v1/campaigns`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, target_type, description, priority, target_count }),
    });
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
    name: z.string().optional(),
    company: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    position: z.string().optional(),
    location: z.string().optional(),
    source: z.enum(["manual", "scraper", "import", "api"]).optional(),
    campaign_id: z.string().optional(),
    baseUrl: z.string().optional(),
  },
  async ({ name, company, email, phone, position, location, source, campaign_id, baseUrl }) => {
    const out = await httpJson(`${baseUrl ?? LB_BACKEND_BASE}/v1/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, company, email, phone, position, location, source: source ?? "manual", campaign_id }),
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

server.tool("lb_sources", { baseUrl: z.string().optional() }, async ({ baseUrl }) => {
  const out = await httpJson(`${baseUrl ?? LB_BACKEND_BASE}/v1/sources`);
  return { content: [{ type: "text", text: JSON.stringify(out, null, 2) }] };
});

server.tool("lb_templates", { type: z.string().optional(), baseUrl: z.string().optional() }, async ({ type, baseUrl }) => {
  const params = new URLSearchParams();
  if (type) params.set("type", type);
  const out = await httpJson(`${baseUrl ?? LB_BACKEND_BASE}/v1/templates${params.toString() ? "?" + params : ""}`);
  return { content: [{ type: "text", text: JSON.stringify(out, null, 2) }] };
});

server.tool("lb_db_query", { query: z.string().min(1) }, async ({ query }) => {
  if (!query.trim().toUpperCase().startsWith("SELECT")) {
    return { content: [{ type: "text", text: JSON.stringify({ ok: false, error: "Only SELECT queries allowed" }, null, 2) }] };
  }
  const cmd = `sqlite3 -header -column "/root/lead-builder-backend/data/lead-builder.db" "${query.replace(/"/g, '\\"')}"`;
  const out = await sshExec(LB_SSH_HOST, cmd);
  return { content: [{ type: "text", text: JSON.stringify({ query, ...out }, null, 2) }] };
});

server.tool("lb_server_stats", {}, async () => {
  const cmd = `echo "=== DISK ===" && df -h / && echo "\\n=== MEMORY ===" && free -h && echo "\\n=== CPU ===" && top -bn1 | head -5`;
  const out = await sshExec(LB_SSH_HOST, cmd);
  return { content: [{ type: "text", text: JSON.stringify(out, null, 2) }] };
});

// ============================================
// CLOUD AGENTS TOOLS (ca_*)
// ============================================

server.tool("ca_health", { baseUrl: z.string().optional() }, async ({ baseUrl }) => {
  const out = await httpJson(`${baseUrl ?? CA_BACKEND_BASE}/health`);
  return { content: [{ type: "text", text: JSON.stringify(out, null, 2) }] };
});

server.tool(
  "ca_chat_send",
  {
    token: z.string().min(10),
    agentName: z.string().min(1),
    message: z.string().min(1),
    baseUrl: z.string().optional(),
  },
  async ({ token, agentName, message, baseUrl }) => {
    const out = await httpJson(`${baseUrl ?? CA_BACKEND_BASE}/api/chat/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ agentName, message }),
    });
    return { content: [{ type: "text", text: JSON.stringify(out, null, 2) }] };
  }
);

server.tool("ca_agents_status", { token: z.string().optional(), baseUrl: z.string().optional() }, async ({ token, baseUrl }) => {
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const out = await httpJson(`${baseUrl ?? CA_BACKEND_BASE}/api/agents/status`, { headers });
  return { content: [{ type: "text", text: JSON.stringify(out, null, 2) }] };
});

server.tool(
  "ca_tasks_list",
  { token: z.string().optional(), state: z.string().optional(), baseUrl: z.string().optional() },
  async ({ token, state, baseUrl }) => {
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const url = state ? `${baseUrl ?? CA_BACKEND_BASE}/api/tasks?state=${state}` : `${baseUrl ?? CA_BACKEND_BASE}/api/tasks`;
    const out = await httpJson(url, { headers });
    return { content: [{ type: "text", text: JSON.stringify(out, null, 2) }] };
  }
);

server.tool("ca_pm2_status", { format: z.enum(["table", "json"]).optional() }, async ({ format }) => {
  const cmd = format === "json" ? "pm2 jlist" : "pm2 status";
  const out = await sshExec(CA_SSH_HOST, cmd);
  return { content: [{ type: "text", text: JSON.stringify({ command: cmd, ...out }, null, 2) }] };
});

server.tool(
  "ca_pm2_logs",
  { process: z.string().optional(), lines: z.number().optional(), err: z.boolean().optional() },
  async ({ process, lines, err }) => {
    const cmd = `pm2 logs ${process ?? "all"} --nostream --lines ${lines ?? 50} ${err ? "--err" : ""}`.trim();
    const out = await sshExec(CA_SSH_HOST, cmd);
    return { content: [{ type: "text", text: JSON.stringify({ command: cmd, ...out }, null, 2) }] };
  }
);

server.tool("ca_server_stats", {}, async () => {
  const cmd = `echo "=== DISK ===" && df -h / && echo "\\n=== MEMORY ===" && free -h && echo "\\n=== CPU ===" && top -bn1 | head -5`;
  const out = await sshExec(CA_SSH_HOST, cmd);
  return { content: [{ type: "text", text: JSON.stringify(out, null, 2) }] };
});

server.tool(
  "ca_deploy",
  { project: z.enum(["cloud-agents", "admin-dashboard"]), restart: z.boolean().optional() },
  async ({ project, restart }) => {
    const path = project === "cloud-agents" ? "/root/cloud-agents" : "/root/admin-dashboard";
    let cmd = `cd ${path} && git pull origin main`;
    if (restart !== false) cmd += ` && npm install && pm2 restart all`;
    const out = await sshExec(CA_SSH_HOST, cmd);
    return { content: [{ type: "text", text: JSON.stringify({ project, ...out }, null, 2) }] };
  }
);

server.tool("ca_db_query", { query: z.string().min(1), database: z.string().optional() }, async ({ query, database }) => {
  if (!query.trim().toUpperCase().startsWith("SELECT")) {
    return { content: [{ type: "text", text: JSON.stringify({ ok: false, error: "Only SELECT queries allowed" }, null, 2) }] };
  }
  const db = database ?? "/root/cloud-agents/data/app.sqlite";
  const cmd = `sqlite3 -header -column "${db}" "${query.replace(/"/g, '\\"')}"`;
  const out = await sshExec(CA_SSH_HOST, cmd);
  return { content: [{ type: "text", text: JSON.stringify({ query, ...out }, null, 2) }] };
});

// ============================================
// BRAIN KNOWLEDGE BASE TOOLS
// ============================================

server.tool(
  "brain_ingest_text",
  {
    token: z.string().min(10),
    title: z.string().min(1),
    content: z.string().min(1),
    tags: z.array(z.string()).optional(),
    baseUrl: z.string().optional(),
  },
  async ({ token, title, content, tags, baseUrl }) => {
    const out = await httpJson(`${baseUrl ?? CA_BACKEND_BASE}/api/brain/ingest/text`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title, content, metadata: tags ? { tags } : undefined }),
    });
    return { content: [{ type: "text", text: JSON.stringify(out, null, 2) }] };
  }
);

server.tool(
  "brain_search",
  {
    token: z.string().min(10),
    query: z.string().min(1),
    mode: z.enum(["semantic", "keyword", "hybrid"]).optional(),
    limit: z.number().optional(),
    baseUrl: z.string().optional(),
  },
  async ({ token, query, mode, limit, baseUrl }) => {
    const params = new URLSearchParams({ q: query });
    if (mode) params.set("mode", mode);
    if (limit) params.set("limit", String(limit));
    const out = await httpJson(`${baseUrl ?? CA_BACKEND_BASE}/api/brain/search?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return { content: [{ type: "text", text: JSON.stringify(out, null, 2) }] };
  }
);

server.tool("brain_stats", { token: z.string().min(10), baseUrl: z.string().optional() }, async ({ token, baseUrl }) => {
  const out = await httpJson(`${baseUrl ?? CA_BACKEND_BASE}/api/brain/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return { content: [{ type: "text", text: JSON.stringify(out, null, 2) }] };
});

// ============================================
// AUDIT & OPS TOOLS
// ============================================

server.tool(
  "audit_events_list",
  {
    token: z.string().min(10),
    kind: z.string().optional(),
    severity: z.enum(["info", "warn", "error"]).optional(),
    since: z.string().optional(),
    limit: z.number().optional(),
    baseUrl: z.string().optional(),
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
  "ops_events",
  { kind: z.string().optional(), severity: z.enum(["info", "warn", "error"]).optional(), limit: z.number().optional() },
  async ({ kind, severity, limit }) => {
    const conditions: string[] = [];
    if (kind) conditions.push(`kind = '${kind}'`);
    if (severity) conditions.push(`severity = '${severity}'`);
    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const query = `SELECT id, ts, kind, severity, message FROM audit_events ${where} ORDER BY ts DESC LIMIT ${limit ?? 20}`;
    const cmd = `sqlite3 -json "/root/cloud-agents/data/app.sqlite" "${query}"`;
    const out = await sshExec(CA_SSH_HOST, cmd);
    let events: unknown[] = [];
    try { events = JSON.parse(out.stdout); } catch {}
    return { content: [{ type: "text", text: JSON.stringify({ count: events.length, events }, null, 2) }] };
  }
);

server.tool("ops_stats", {}, async () => {
  const queries = {
    events_total: `SELECT COUNT(*) as count FROM audit_events`,
    tasks_by_status: `SELECT status, COUNT(*) as count FROM tasks GROUP BY status`,
    users_total: `SELECT COUNT(*) as count FROM users`,
  };
  const stats: Record<string, unknown> = {};
  for (const [key, query] of Object.entries(queries)) {
    const cmd = `sqlite3 -json "/root/cloud-agents/data/app.sqlite" "${query}"`;
    const out = await sshExec(CA_SSH_HOST, cmd);
    try { stats[key] = JSON.parse(out.stdout); } catch { stats[key] = out.stderr; }
  }
  return { content: [{ type: "text", text: JSON.stringify({ stats }, null, 2) }] };
});

// ============================================
// MAIN
// ============================================

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
