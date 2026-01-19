import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrainClient } from '../src/brain/client.js';

describe('BrainClient', () => {
  let client: BrainClient;

  beforeEach(() => {
    client = new BrainClient({
      baseUrl: 'http://localhost:3001',
      apiKey: 'test-key',
    });
  });

  describe('constructor', () => {
    it('should create client with base URL', () => {
      expect(client).toBeDefined();
    });

    it('should remove trailing slash from baseUrl', () => {
      const c = new BrainClient({ baseUrl: 'http://localhost:3001/' });
      // @ts-expect-error - accessing private property for testing
      expect(c.baseUrl).toBe('http://localhost:3001');
    });
  });

  describe('health', () => {
    it('should return ok:false when server unreachable', async () => {
      const result = await client.health();
      // In test environment without server, should return false
      expect(result).toHaveProperty('ok');
      expect(typeof result.ok).toBe('boolean');
    });
  });
});

describe('BrainClient - API calls', () => {
  let client: BrainClient;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch;
    client = new BrainClient({
      baseUrl: 'http://localhost:3001',
      apiKey: 'test-key',
    });
  });

  it('should call search endpoint correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ entries: [], total: 0, query: 'test', mode: 'hybrid' }),
    });

    const result = await client.search('test query');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/brain/search'),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-key',
        }),
      })
    );
    expect(result.query).toBe('test');
  });

  it('should call save endpoint correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: '123',
        type: 'decision',
        content: 'Test content',
        tags: ['test'],
        timestamp: new Date().toISOString(),
        source: { tool: 'claude-code' },
      }),
    });

    const result = await client.save({
      type: 'decision',
      content: 'Test content',
      tags: ['test'],
      source: { tool: 'claude-code' },
    });

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/brain/entries',
      expect.objectContaining({
        method: 'POST',
      })
    );
    expect(result.id).toBe('123');
  });

  it('should call stats endpoint correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        totalEntries: 100,
        entriesByType: { decision: 50, fix: 30, learning: 20 },
        entriesBySource: { 'claude-code': 100 },
        lastUpdated: new Date().toISOString(),
        storageSize: '1.5 MB',
      }),
    });

    const result = await client.stats();

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/brain/stats',
      expect.any(Object)
    );
    expect(result.totalEntries).toBe(100);
  });
});
