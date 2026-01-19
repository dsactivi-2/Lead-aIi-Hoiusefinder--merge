import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const BACKEND_BASE = process.env.LB_BACKEND_BASE ?? "http://49.13.144.44:3003";
const FRONTEND_BASE = process.env.LB_FRONTEND_BASE ?? "http://49.13.144.44:3000";
const SSH_KEY = process.env.SSH_KEY ?? "~/.ssh/id_ed25519_cloudagents";
const SSH_HOST = process.env.LB_SSH_HOST ?? "root@49.13.144.44";

async function sshExec(command: string): Promise<{ ok: boolean; stdout: string; stderr: string }> {
  try {
    const { stdout, stderr } = await execAsync(
      `ssh -i ${SSH_KEY} -o StrictHostKeyChecking=accept-new ${SSH_HOST} "${command.replace(/"/g, '\\"')}"`,
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

const server = new McpServer({
  name: "lead-builder-mcp",
  version: "1.0.0",
});

// ============================================
// HEALTH & STATUS TOOLS
// ============================================

// Tool: lb_health - Health check backend
server.tool(
  "lb_health",
  { baseUrl: z.string().optional().describe("Override backend base url") },
  async ({ baseUrl }) => {
    const base = baseUrl ?? BACKEND_BASE;
    const out = await httpJson(`${base}/health`);
    return {
      content: [{ type: "text", text: JSON.stringify({ base, ...out }, null, 2) }],
    };
  }
);

// Tool: lb_pm2_status - Show PM2 processes
server.tool(
  "lb_pm2_status",
  {
    format: z.enum(["table", "json"]).optional().describe("Output format (default: table)"),
  },
  async ({ format }) => {
    const cmd = format === "json" ? "pm2 jlist" : "pm2 status";
    const out = await sshExec(cmd);
    return {
      content: [{ type: "text", text: JSON.stringify({ command: cmd, ...out }, null, 2) }],
    };
  }
);

// Tool: lb_pm2_logs - Get PM2 logs
server.tool(
  "lb_pm2_logs",
  {
    process: z.enum(["lead-builder-backend", "lead-builder-frontend", "all"]).optional().describe("Process name (default: all)"),
    lines: z.number().optional().describe("Number of lines (default: 50)"),
    err: z.boolean().optional().describe("Show only error logs"),
  },
  async ({ process, lines, err }) => {
    const n = lines ?? 50;
    const proc = process ?? "all";
    const errFlag = err ? "--err" : "";
    const cmd = `pm2 logs ${proc} --nostream --lines ${n} ${errFlag}`.trim();
    const out = await sshExec(cmd);
    return {
      content: [{ type: "text", text: JSON.stringify({ command: cmd, ...out }, null, 2) }],
    };
  }
);

// Tool: lb_deploy - Deploy latest code
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
      const out = await sshExec(cmd);
      results.push({ project: "backend", out });
    }

    if (project === "frontend" || project === "both") {
      let cmd = `cd /root/lead-builder-frontend && git pull origin main && npm install && npm run build`;
      if (shouldRestart) cmd += ` && pm2 restart lead-builder-frontend`;
      const out = await sshExec(cmd);
      results.push({ project: "frontend", out });
    }

    return {
      content: [{ type: "text", text: JSON.stringify({ results }, null, 2) }],
    };
  }
);

// ============================================
// DASHBOARD & STATS TOOLS
// ============================================

// Tool: lb_stats - Get dashboard statistics
server.tool(
  "lb_stats",
  { baseUrl: z.string().optional().describe("Override backend base url") },
  async ({ baseUrl }) => {
    const base = baseUrl ?? BACKEND_BASE;
    const out = await httpJson(`${base}/v1/dashboard/stats`);
    return {
      content: [{ type: "text", text: JSON.stringify({ base, ...out }, null, 2) }],
    };
  }
);

// ============================================
// CAMPAIGNS TOOLS
// ============================================

// Tool: lb_campaigns - List campaigns
server.tool(
  "lb_campaigns",
  {
    status: z.enum(["active", "paused", "completed", "archived"]).optional().describe("Filter by status"),
    priority: z.enum(["urgent", "high", "normal", "low"]).optional().describe("Filter by priority"),
    baseUrl: z.string().optional().describe("Override backend base url"),
  },
  async ({ status, priority, baseUrl }) => {
    const base = baseUrl ?? BACKEND_BASE;
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (priority) params.set("priority", priority);
    const url = `${base}/v1/campaigns${params.toString() ? "?" + params : ""}`;
    const out = await httpJson(url);
    return {
      content: [{ type: "text", text: JSON.stringify({ base, ...out }, null, 2) }],
    };
  }
);

// Tool: lb_campaign_create - Create a campaign
server.tool(
  "lb_campaign_create",
  {
    name: z.string().min(1).describe("Campaign name"),
    target_type: z.enum(["lead_campaign", "job_posting", "call_list"]).describe("Target type"),
    description: z.string().optional().describe("Campaign description"),
    priority: z.enum(["urgent", "high", "normal", "low"]).optional().describe("Priority (default: normal)"),
    target_count: z.number().optional().describe("Target lead count (default: 100)"),
    baseUrl: z.string().optional().describe("Override backend base url"),
  },
  async ({ name, target_type, description, priority, target_count, baseUrl }) => {
    const base = baseUrl ?? BACKEND_BASE;
    const out = await httpJson(`${base}/v1/campaigns`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, target_type, description, priority, target_count }),
    });
    return {
      content: [{ type: "text", text: JSON.stringify({ base, ...out }, null, 2) }],
    };
  }
);

// Tool: lb_campaign_stats - Get campaign statistics
server.tool(
  "lb_campaign_stats",
  {
    id: z.string().describe("Campaign ID"),
    baseUrl: z.string().optional().describe("Override backend base url"),
  },
  async ({ id, baseUrl }) => {
    const base = baseUrl ?? BACKEND_BASE;
    const out = await httpJson(`${base}/v1/campaigns/${id}/stats`);
    return {
      content: [{ type: "text", text: JSON.stringify({ base, ...out }, null, 2) }],
    };
  }
);

// ============================================
// LEADS TOOLS
// ============================================

// Tool: lb_leads - List leads
server.tool(
  "lb_leads",
  {
    campaign_id: z.string().optional().describe("Filter by campaign ID"),
    status: z.enum(["new", "contacted", "responded", "qualified", "converted", "rejected"]).optional().describe("Filter by status"),
    quality: z.enum(["hot", "warm", "cold", "unknown"]).optional().describe("Filter by quality"),
    limit: z.number().optional().describe("Limit (default: 100)"),
    offset: z.number().optional().describe("Offset (default: 0)"),
    baseUrl: z.string().optional().describe("Override backend base url"),
  },
  async ({ campaign_id, status, quality, limit, offset, baseUrl }) => {
    const base = baseUrl ?? BACKEND_BASE;
    const params = new URLSearchParams();
    if (campaign_id) params.set("campaign_id", campaign_id);
    if (status) params.set("status", status);
    if (quality) params.set("quality", quality);
    if (limit) params.set("limit", String(limit));
    if (offset) params.set("offset", String(offset));
    const url = `${base}/v1/leads${params.toString() ? "?" + params : ""}`;
    const out = await httpJson(url);
    return {
      content: [{ type: "text", text: JSON.stringify({ base, ...out }, null, 2) }],
    };
  }
);

// Tool: lb_lead_create - Create a lead
server.tool(
  "lb_lead_create",
  {
    name: z.string().optional().describe("Lead name"),
    company: z.string().optional().describe("Company name"),
    email: z.string().optional().describe("Email address"),
    phone: z.string().optional().describe("Phone number"),
    position: z.string().optional().describe("Job position"),
    location: z.string().optional().describe("Location"),
    source: z.enum(["manual", "scraper", "import", "api"]).optional().describe("Lead source (default: manual)"),
    campaign_id: z.string().optional().describe("Associated campaign ID"),
    baseUrl: z.string().optional().describe("Override backend base url"),
  },
  async ({ name, company, email, phone, position, location, source, campaign_id, baseUrl }) => {
    const base = baseUrl ?? BACKEND_BASE;
    const out = await httpJson(`${base}/v1/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, company, email, phone, position, location, source: source ?? "manual", campaign_id }),
    });
    return {
      content: [{ type: "text", text: JSON.stringify({ base, ...out }, null, 2) }],
    };
  }
);

// ============================================
// COMMUNICATIONS TOOLS
// ============================================

// Tool: lb_communications - List communications
server.tool(
  "lb_communications",
  {
    lead_id: z.string().optional().describe("Filter by lead ID"),
    campaign_id: z.string().optional().describe("Filter by campaign ID"),
    channel: z.enum(["email", "whatsapp", "phone", "linkedin"]).optional().describe("Filter by channel"),
    limit: z.number().optional().describe("Limit (default: 50)"),
    baseUrl: z.string().optional().describe("Override backend base url"),
  },
  async ({ lead_id, campaign_id, channel, limit, baseUrl }) => {
    const base = baseUrl ?? BACKEND_BASE;
    const params = new URLSearchParams();
    if (lead_id) params.set("lead_id", lead_id);
    if (campaign_id) params.set("campaign_id", campaign_id);
    if (channel) params.set("channel", channel);
    if (limit) params.set("limit", String(limit));
    const url = `${base}/v1/communications${params.toString() ? "?" + params : ""}`;
    const out = await httpJson(url);
    return {
      content: [{ type: "text", text: JSON.stringify({ base, ...out }, null, 2) }],
    };
  }
);

// ============================================
// SOURCES TOOLS
// ============================================

// Tool: lb_sources - List lead sources
server.tool(
  "lb_sources",
  { baseUrl: z.string().optional().describe("Override backend base url") },
  async ({ baseUrl }) => {
    const base = baseUrl ?? BACKEND_BASE;
    const out = await httpJson(`${base}/v1/sources`);
    return {
      content: [{ type: "text", text: JSON.stringify({ base, ...out }, null, 2) }],
    };
  }
);

// ============================================
// TEMPLATES TOOLS
// ============================================

// Tool: lb_templates - List templates
server.tool(
  "lb_templates",
  {
    type: z.string().optional().describe("Filter by type"),
    baseUrl: z.string().optional().describe("Override backend base url"),
  },
  async ({ type, baseUrl }) => {
    const base = baseUrl ?? BACKEND_BASE;
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    const url = `${base}/v1/templates${params.toString() ? "?" + params : ""}`;
    const out = await httpJson(url);
    return {
      content: [{ type: "text", text: JSON.stringify({ base, ...out }, null, 2) }],
    };
  }
);

// ============================================
// DATABASE TOOLS
// ============================================

// Tool: lb_db_query - Execute read-only SQL query
server.tool(
  "lb_db_query",
  {
    query: z.string().min(1).describe("SQL query (SELECT only)"),
  },
  async ({ query }) => {
    const upperQuery = query.trim().toUpperCase();
    if (!upperQuery.startsWith("SELECT")) {
      return {
        content: [{ type: "text", text: JSON.stringify({ ok: false, error: "Only SELECT queries allowed" }, null, 2) }],
      };
    }

    const db = "/root/lead-builder-backend/data/lead-builder.db";
    const escapedQuery = query.replace(/"/g, '\\"');
    const cmd = `sqlite3 -header -column "${db}" "${escapedQuery}"`;
    const out = await sshExec(cmd);
    return {
      content: [{ type: "text", text: JSON.stringify({ command: "lb_db_query", query, ...out }, null, 2) }],
    };
  }
);

// Tool: lb_server_stats - Get server resource usage
server.tool(
  "lb_server_stats",
  {},
  async () => {
    const cmd = `echo "=== DISK ===" && df -h / && echo "\\n=== MEMORY ===" && free -h && echo "\\n=== CPU ===" && top -bn1 | head -5`;
    const out = await sshExec(cmd);
    return {
      content: [{ type: "text", text: JSON.stringify({ tool: "lb_server_stats", ...out }, null, 2) }],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
