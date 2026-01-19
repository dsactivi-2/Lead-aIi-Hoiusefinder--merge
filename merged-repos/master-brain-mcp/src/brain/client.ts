// Brain Client - Verbindung zum Master Brain Backend
import type { BrainEntry, SearchResult, BrainStats, MemoryType } from '../types/index.js';

export interface BrainClientConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
}

export class BrainClient {
  private baseUrl: string;
  private apiKey?: string;
  private timeout: number;

  constructor(config: BrainClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.apiKey = config.apiKey;
    this.timeout = config.timeout ?? 30000;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      return await response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Speichert einen Eintrag im Brain
   */
  async save(entry: Omit<BrainEntry, 'id' | 'timestamp'>): Promise<BrainEntry> {
    return this.request<BrainEntry>('/api/brain/entries', {
      method: 'POST',
      body: JSON.stringify(entry),
    });
  }

  /**
   * Sucht im Brain (hybrid: semantic + keyword)
   */
  async search(
    query: string,
    options?: {
      mode?: 'semantic' | 'keyword' | 'hybrid';
      type?: MemoryType;
      tags?: string[];
      limit?: number;
    }
  ): Promise<SearchResult> {
    const params = new URLSearchParams({
      q: query,
      mode: options?.mode ?? 'hybrid',
      limit: String(options?.limit ?? 10),
    });

    if (options?.type) params.set('type', options.type);
    if (options?.tags?.length) params.set('tags', options.tags.join(','));

    return this.request<SearchResult>(`/api/brain/search?${params}`);
  }

  /**
   * Holt Brain-Statistiken
   */
  async stats(): Promise<BrainStats> {
    return this.request<BrainStats>('/api/brain/stats');
  }

  /**
   * Holt die letzten Einträge
   */
  async recent(limit = 10, type?: MemoryType): Promise<BrainEntry[]> {
    const params = new URLSearchParams({ limit: String(limit) });
    if (type) params.set('type', type);

    return this.request<BrainEntry[]>(`/api/brain/recent?${params}`);
  }

  /**
   * Löscht einen Eintrag
   */
  async delete(id: string): Promise<void> {
    await this.request(`/api/brain/entries/${id}`, { method: 'DELETE' });
  }

  /**
   * Prüft ob das Brain erreichbar ist
   */
  async health(): Promise<{ ok: boolean; version?: string }> {
    try {
      const result = await this.request<{ status: string; version?: string }>(
        '/api/brain/health'
      );
      return { ok: result.status === 'ok', version: result.version };
    } catch {
      return { ok: false };
    }
  }
}

// Singleton-Instanz
let brainClient: BrainClient | null = null;

export function getBrainClient(): BrainClient {
  if (!brainClient) {
    const baseUrl = process.env.BRAIN_API_URL || 'http://localhost:3001';
    const apiKey = process.env.BRAIN_API_KEY;

    brainClient = new BrainClient({ baseUrl, apiKey });
  }
  return brainClient;
}
