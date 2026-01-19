#!/usr/bin/env node
/**
 * Master Brain MCP Hub
 *
 * Ein MCP Server der alle AI-Tools (Claude Code, Codex, Cursor, etc.)
 * mit dem Master Brain verbindet. Inklusive Auto-Memory Middleware
 * die wichtige Interaktionen automatisch speichert.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { config } from 'dotenv';

import {
  brainSearch,
  searchToolDefinition,
  brainSave,
  saveToolDefinition,
  brainStats,
  statsToolDefinition,
  brainRecent,
  recentToolDefinition,
} from './tools/index.js';
import { getAutoMemory } from './middleware/auto-memory.js';
import { getBrainClient } from './brain/client.js';

// Load environment
config();

const VERSION = '1.0.0';

// Create MCP Server
const server = new Server(
  {
    name: 'master-brain-mcp',
    version: VERSION,
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool definitions
const tools = [
  searchToolDefinition,
  saveToolDefinition,
  statsToolDefinition,
  recentToolDefinition,
  {
    name: 'brain_health',
    description: 'Prüft ob das Master Brain erreichbar ist',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'auto_memory_status',
    description: 'Zeigt Status der Auto-Memory Middleware',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'auto_memory_config',
    description: 'Konfiguriert die Auto-Memory Middleware',
    inputSchema: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean', description: 'Auto-Memory aktivieren/deaktivieren' },
        minConfidence: { type: 'number', description: 'Min. Confidence zum Speichern (0-1)' },
      },
    },
  },
];

// List Tools Handler
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools,
}));

// Call Tool Handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'brain_search': {
        const result = await brainSearch(args as Parameters<typeof brainSearch>[0]);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      case 'brain_save': {
        const result = await brainSave(args as Parameters<typeof brainSave>[0]);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      case 'brain_stats': {
        const result = await brainStats();
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      case 'brain_recent': {
        const result = await brainRecent(args as Parameters<typeof brainRecent>[0]);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      case 'brain_health': {
        const brain = getBrainClient();
        const health = await brain.health();
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              data: {
                brainConnected: health.ok,
                version: health.version,
                mcpVersion: VERSION,
              },
            }, null, 2),
          }],
        };
      }

      case 'auto_memory_status': {
        const autoMemory = getAutoMemory();
        const status = autoMemory.getStatus();
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ success: true, data: status }, null, 2),
          }],
        };
      }

      case 'auto_memory_config': {
        const autoMemory = getAutoMemory();
        if (args && typeof args === 'object') {
          autoMemory.updateConfig(args as Record<string, unknown>);
        }
        const status = autoMemory.getStatus();
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: 'Konfiguration aktualisiert',
              data: status.config,
            }, null, 2),
          }],
        };
      }

      default:
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: `Unknown tool: ${name}` }) }],
          isError: true,
        };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: JSON.stringify({ error: message }) }],
      isError: true,
    };
  }
});

// Start Server
async function main() {
  console.error(`[Master Brain MCP Hub v${VERSION}] Starting...`);

  // Verify brain connection
  const brain = getBrainClient();
  const health = await brain.health();
  if (health.ok) {
    console.error(`[Master Brain MCP Hub] Connected to Brain (v${health.version})`);
  } else {
    console.error('[Master Brain MCP Hub] WARNING: Brain not reachable!');
  }

  // Initialize auto-memory
  const autoMemory = getAutoMemory();
  console.error(`[Master Brain MCP Hub] Auto-Memory: ${autoMemory.getStatus().config.enabled ? 'enabled' : 'disabled'}`);

  // Start stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('[Master Brain MCP Hub] Ready!');
}

main().catch((error) => {
  console.error('[Master Brain MCP Hub] Fatal error:', error);
  process.exit(1);
});
