import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const BACKEND_BASE = process.env.BACKEND_BASE ?? "http://178.156.178.70:3001";
const SSH_KEY = process.env.SSH_KEY ?? "~/.ssh/id_ed25519_cloudagents";
const SSH_HOST = process.env.SSH_HOST ?? "root@178.156.178.70";

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
  name: "cloud-agents-mcp",
  version: "0.1.0",
});

// Tool: health_check
server.tool(
  "health_check",
  { baseUrl: z.string().optional().describe("Override backend base url") },
  async ({ baseUrl }) => {
    const base = baseUrl ?? BACKEND_BASE;
    const out = await httpJson(`${base}/health`);
    return {
      content: [{ type: "text", text: JSON.stringify({ base, ...out }, null, 2) }],
    };
  }
);

// Tool: chat_send
server.tool(
  "chat_send",
  {
    token: z.string().min(10).describe("JWT access token (Bearer)"),
    agentName: z.string().min(1).describe("Agent name (e.g. emir)"),
    message: z.string().min(1).describe("Message to send"),
    baseUrl: z.string().optional().describe("Override backend base url"),
  },
  async ({ token, agentName, message, baseUrl }) => {
    const base = baseUrl ?? BACKEND_BASE;
    const out = await httpJson(`${base}/api/chat/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ agentName, message }),
    });
    return {
      content: [{ type: "text", text: JSON.stringify({ base, ...out }, null, 2) }],
    };
  }
);

// Tool: agents_status
server.tool(
  "agents_status",
  {
    token: z.string().min(10).optional().describe("JWT access token (Bearer)"),
    baseUrl: z.string().optional().describe("Override backend base url"),
  },
  async ({ token, baseUrl }) => {
    const base = baseUrl ?? BACKEND_BASE;
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const out = await httpJson(`${base}/api/agents/status`, { headers });
    return {
      content: [{ type: "text", text: JSON.stringify({ base, ...out }, null, 2) }],
    };
  }
);

// Tool: tasks_list
server.tool(
  "tasks_list",
  {
    token: z.string().min(10).optional().describe("JWT access token (Bearer)"),
    baseUrl: z.string().optional().describe("Override backend base url"),
    state: z.string().optional().describe("Filter by task state (e.g. pending, running, completed)"),
  },
  async ({ token, baseUrl, state }) => {
    const base = baseUrl ?? BACKEND_BASE;
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const url = state ? `${base}/api/tasks?state=${encodeURIComponent(state)}` : `${base}/api/tasks`;
    const out = await httpJson(url, { headers });
    return {
      content: [{ type: "text", text: JSON.stringify({ base, ...out }, null, 2) }],
    };
  }
);

// ============================================
// SERVER OPERATIONS TOOLS (via SSH)
// ============================================

// Tool: pm2_status - Show all PM2 processes
server.tool(
  "pm2_status",
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

// Tool: pm2_logs - Get logs from a PM2 process
server.tool(
  "pm2_logs",
  {
    process: z.string().optional().describe("Process name or id (default: all)"),
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

// Tool: server_stats - Get server resource usage
server.tool(
  "server_stats",
  {},
  async () => {
    const cmd = `echo "=== DISK ===" && df -h / && echo "\\n=== MEMORY ===" && free -h && echo "\\n=== CPU ===" && top -bn1 | head -5 && echo "\\n=== UPTIME ===" && uptime`;
    const out = await sshExec(cmd);
    return {
      content: [{ type: "text", text: JSON.stringify({ command: "server_stats", ...out }, null, 2) }],
    };
  }
);

// Tool: deploy_trigger - Pull latest code and restart services
server.tool(
  "deploy_trigger",
  {
    project: z.enum(["cloud-agents", "admin-dashboard"]).describe("Project to deploy"),
    restart: z.boolean().optional().describe("Restart PM2 after pull (default: true)"),
  },
  async ({ project, restart }) => {
    const shouldRestart = restart !== false;
    const projectPath = project === "cloud-agents" ? "/root/cloud-agents" : "/root/admin-dashboard";

    let cmd = `cd ${projectPath} && git pull origin main`;
    if (shouldRestart) {
      cmd += ` && npm install && pm2 restart all`;
    }

    const out = await sshExec(cmd);
    return {
      content: [{ type: "text", text: JSON.stringify({ command: cmd, project, ...out }, null, 2) }],
    };
  }
);

// Tool: db_query - Execute read-only SQL query (SQLite)
server.tool(
  "db_query",
  {
    query: z.string().min(1).describe("SQL query (SELECT only)"),
    database: z.string().optional().describe("Database file path (default: /root/cloud-agents/data/app.sqlite)"),
  },
  async ({ query, database }) => {
    // Security: Only allow SELECT queries
    const upperQuery = query.trim().toUpperCase();
    if (!upperQuery.startsWith("SELECT")) {
      return {
        content: [{ type: "text", text: JSON.stringify({ ok: false, error: "Only SELECT queries allowed" }, null, 2) }],
      };
    }

    const db = database ?? "/root/cloud-agents/data/app.sqlite";
    const escapedQuery = query.replace(/"/g, '\\"');
    const cmd = `sqlite3 -header -column "${db}" "${escapedQuery}"`;
    const out = await sshExec(cmd);
    return {
      content: [{ type: "text", text: JSON.stringify({ command: "db_query", database: db, query, ...out }, null, 2) }],
    };
  }
);

// ============================================
// BRAIN KNOWLEDGE BASE TOOLS
// ============================================

// Tool: brain_ingest_text - Add text to knowledge base
server.tool(
  "brain_ingest_text",
  {
    token: z.string().min(10).describe("JWT access token (Bearer) - userId is extracted from JWT"),
    title: z.string().min(1).describe("Document title"),
    content: z.string().min(1).describe("Text content to ingest"),
    tags: z.array(z.string()).optional().describe("Optional tags for categorization"),
    baseUrl: z.string().optional().describe("Override backend base url"),
  },
  async ({ token, title, content, tags, baseUrl }) => {
    const base = baseUrl ?? BACKEND_BASE;
    const out = await httpJson(`${base}/api/brain/ingest/text`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title, content, metadata: tags ? { tags } : undefined }),
    });
    return {
      content: [{ type: "text", text: JSON.stringify({ base, ...out }, null, 2) }],
    };
  }
);

// Tool: brain_search - Search knowledge base
server.tool(
  "brain_search",
  {
    token: z.string().min(10).describe("JWT access token (Bearer) - userId is extracted from JWT"),
    query: z.string().min(1).describe("Search query"),
    mode: z.enum(["semantic", "keyword", "hybrid"]).optional().describe("Search mode (default: hybrid)"),
    limit: z.number().optional().describe("Max results (default: 10)"),
    baseUrl: z.string().optional().describe("Override backend base url"),
  },
  async ({ token, query, mode, limit, baseUrl }) => {
    const base = baseUrl ?? BACKEND_BASE;
    const params = new URLSearchParams({ q: query });
    if (mode) params.set("mode", mode);
    if (limit) params.set("limit", String(limit));

    const out = await httpJson(`${base}/api/brain/search?${params}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return {
      content: [{ type: "text", text: JSON.stringify({ base, ...out }, null, 2) }],
    };
  }
);

// Tool: brain_stats - Get brain statistics
server.tool(
  "brain_stats",
  {
    token: z.string().min(10).describe("JWT access token (Bearer) - userId is extracted from JWT"),
    baseUrl: z.string().optional().describe("Override backend base url"),
  },
  async ({ token, baseUrl }) => {
    const base = baseUrl ?? BACKEND_BASE;
    const out = await httpJson(`${base}/api/brain/stats`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return {
      content: [{ type: "text", text: JSON.stringify({ base, ...out }, null, 2) }],
    };
  }
);

// ============================================
// AUDIT EVENTS TOOLS
// ============================================

// Tool: audit_events_list - List audit events with filters
server.tool(
  "audit_events_list",
  {
    token: z.string().min(10).describe("JWT access token (Bearer)"),
    kind: z.string().optional().describe("Filter by event kind (e.g. user_login, task_created, brain_search)"),
    severity: z.enum(["info", "warn", "error"]).optional().describe("Filter by severity"),
    since: z.string().optional().describe("ISO date string - get events since this time"),
    limit: z.number().optional().describe("Max events to return (default: 50, max: 500)"),
    baseUrl: z.string().optional().describe("Override backend base url"),
  },
  async ({ token, kind, severity, since, limit, baseUrl }) => {
    const base = baseUrl ?? BACKEND_BASE;
    const params = new URLSearchParams();
    if (kind) params.set("kind", kind);
    if (severity) params.set("severity", severity);
    if (since) params.set("since", since);
    if (limit) params.set("limit", String(limit));

    const url = `${base}/api/audit/events${params.toString() ? "?" + params : ""}`;
    const out = await httpJson(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return {
      content: [{ type: "text", text: JSON.stringify({ base, ...out }, null, 2) }],
    };
  }
);

// Tool: audit_events_stats - Get audit event statistics (Admin only)
server.tool(
  "audit_events_stats",
  {
    token: z.string().min(10).describe("JWT access token (Bearer) - requires admin role"),
    baseUrl: z.string().optional().describe("Override backend base url"),
  },
  async ({ token, baseUrl }) => {
    const base = baseUrl ?? BACKEND_BASE;
    const out = await httpJson(`${base}/api/audit/events/stats`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return {
      content: [{ type: "text", text: JSON.stringify({ base, ...out }, null, 2) }],
    };
  }
);

// ============================================
// OPS DASHBOARD TOOLS (Direct SQLite - no auth required)
// ============================================

const DB_PATH = "/root/cloud-agents/data/app.sqlite";

// Tool: ops_events - Get recent audit events (no auth, direct DB)
server.tool(
  "ops_events",
  {
    kind: z.string().optional().describe("Filter by event kind (e.g. user_login, deploy, chat_sent)"),
    severity: z.enum(["info", "warn", "error"]).optional().describe("Filter by severity"),
    limit: z.number().optional().describe("Max events (default: 20)"),
  },
  async ({ kind, severity, limit }) => {
    const n = limit ?? 20;
    let where = "";
    const conditions: string[] = [];
    if (kind) conditions.push(`kind = '${kind}'`);
    if (severity) conditions.push(`severity = '${severity}'`);
    if (conditions.length > 0) where = `WHERE ${conditions.join(" AND ")}`;

    const query = `SELECT id, ts, kind, severity, message, agent_id, user_id FROM audit_events ${where} ORDER BY ts DESC LIMIT ${n}`;
    const cmd = `sqlite3 -json "${DB_PATH}" "${query}"`;
    const out = await sshExec(cmd);

    let events: unknown[] = [];
    if (out.ok && out.stdout) {
      try {
        events = JSON.parse(out.stdout);
      } catch {
        events = [];
      }
    }

    return {
      content: [{ type: "text", text: JSON.stringify({ tool: "ops_events", count: events.length, events, ...out }, null, 2) }],
    };
  }
);

// Tool: ops_tasks_history - Get task history (no auth, direct DB)
server.tool(
  "ops_tasks_history",
  {
    status: z.string().optional().describe("Filter by status (pending, in_progress, completed, stopped)"),
    limit: z.number().optional().describe("Max tasks (default: 20)"),
  },
  async ({ status, limit }) => {
    const n = limit ?? 20;
    const where = status ? `WHERE status = '${status}'` : "";

    const query = `SELECT id, title, status, priority, assignee, created_at, updated_at FROM tasks ${where} ORDER BY created_at DESC LIMIT ${n}`;
    const cmd = `sqlite3 -json "${DB_PATH}" "${query}"`;
    const out = await sshExec(cmd);

    let tasks: unknown[] = [];
    if (out.ok && out.stdout) {
      try {
        tasks = JSON.parse(out.stdout);
      } catch {
        tasks = [];
      }
    }

    return {
      content: [{ type: "text", text: JSON.stringify({ tool: "ops_tasks_history", count: tasks.length, tasks, ...out }, null, 2) }],
    };
  }
);

// Tool: ops_stats - Get aggregated statistics (no auth, direct DB)
server.tool(
  "ops_stats",
  {},
  async () => {
    const queries = {
      events_total: `SELECT COUNT(*) as count FROM audit_events`,
      events_by_kind: `SELECT kind, COUNT(*) as count FROM audit_events GROUP BY kind ORDER BY count DESC LIMIT 10`,
      events_by_severity: `SELECT severity, COUNT(*) as count FROM audit_events GROUP BY severity`,
      tasks_by_status: `SELECT status, COUNT(*) as count FROM tasks GROUP BY status`,
      users_total: `SELECT COUNT(*) as count FROM users`,
      brain_docs: `SELECT COUNT(*) as count FROM brain_docs`,
    };

    const stats: Record<string, unknown> = {};

    for (const [key, query] of Object.entries(queries)) {
      const cmd = `sqlite3 -json "${DB_PATH}" "${query}"`;
      const out = await sshExec(cmd);
      if (out.ok && out.stdout) {
        try {
          stats[key] = JSON.parse(out.stdout);
        } catch {
          stats[key] = out.stdout;
        }
      } else {
        stats[key] = { error: out.stderr };
      }
    }

    return {
      content: [{ type: "text", text: JSON.stringify({ tool: "ops_stats", stats }, null, 2) }],
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
