// Auto-Memory Middleware
// Analysiert Interaktionen und speichert wichtige Inhalte automatisch

import Anthropic from '@anthropic-ai/sdk';
import type { AnalysisResult, AutoMemoryConfig, MemorySource, MemoryType } from '../types/index.js';
import { getBrainClient } from '../brain/client.js';

const DEFAULT_CONFIG: AutoMemoryConfig = {
  enabled: true,
  minConfidence: 0.7,
  excludeTypes: [],
  maxEntriesPerSession: 50,
  deduplicationWindow: 30, // 30 Minuten
};

export class AutoMemoryMiddleware {
  private config: AutoMemoryConfig;
  private anthropic: Anthropic;
  private sessionEntries: Map<string, number> = new Map();
  private recentHashes: Set<string> = new Set();

  constructor(config: Partial<AutoMemoryConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.anthropic = new Anthropic();

    // Cleanup alte Hashes alle 30 Minuten
    setInterval(() => this.recentHashes.clear(), this.config.deduplicationWindow * 60 * 1000);
  }

  /**
   * Analysiert eine Interaktion und speichert sie wenn wichtig
   */
  async processInteraction(
    request: string,
    response: string,
    source: MemorySource
  ): Promise<{ saved: boolean; entry?: AnalysisResult }> {
    if (!this.config.enabled) {
      return { saved: false };
    }

    // Rate limiting pro Session
    const sessionKey = source.session_id || 'default';
    const count = this.sessionEntries.get(sessionKey) || 0;
    if (count >= this.config.maxEntriesPerSession) {
      return { saved: false };
    }

    // Deduplizierung
    const hash = this.hashContent(request + response);
    if (this.recentHashes.has(hash)) {
      return { saved: false };
    }

    try {
      // Analyse mit Haiku (schnell & günstig)
      const analysis = await this.analyzeImportance(request, response);

      if (!analysis.isImportant || analysis.confidence < this.config.minConfidence) {
        return { saved: false };
      }

      if (this.config.excludeTypes.includes(analysis.type)) {
        return { saved: false };
      }

      // Im Brain speichern
      const brain = getBrainClient();
      await brain.save({
        type: analysis.type,
        content: analysis.summary,
        tags: analysis.tags,
        source,
        metadata: {
          confidence: analysis.confidence,
          originalRequest: request.substring(0, 500),
          context: analysis.context,
        },
      });

      // Tracking
      this.sessionEntries.set(sessionKey, count + 1);
      this.recentHashes.add(hash);

      console.log(`[AutoMemory] Gespeichert: ${analysis.type} - ${analysis.summary.substring(0, 50)}...`);

      return { saved: true, entry: analysis };
    } catch (error) {
      console.error('[AutoMemory] Fehler:', error);
      return { saved: false };
    }
  }

  /**
   * Analysiert ob eine Interaktion wichtig ist
   */
  private async analyzeImportance(request: string, response: string): Promise<AnalysisResult> {
    const prompt = `Analysiere diese AI-Interaktion und bestimme ob sie für langfristiges Wissen gespeichert werden sollte.

REQUEST:
${request.substring(0, 2000)}

RESPONSE:
${response.substring(0, 3000)}

Antworte NUR mit validem JSON in diesem Format:
{
  "isImportant": boolean,
  "type": "decision" | "fix" | "learning" | "pattern" | "preference" | "config" | "error" | "context",
  "summary": "Kurze Zusammenfassung (max 200 Zeichen)",
  "tags": ["tag1", "tag2", "tag3"],
  "confidence": 0.0-1.0,
  "context": "Optional: Warum ist das wichtig?"
}

Regeln:
- isImportant=true NUR wenn: Entscheidung getroffen, Bug gelöst, etwas Neues gelernt, Pattern etabliert
- isImportant=false für: Smalltalk, einfache Fragen, Code-Generierung ohne Erklärung, Wiederholungen
- confidence: 0.9+ = sehr wichtig, 0.7-0.9 = wichtig, <0.7 = nicht speichern
- tags: max 5, lowercase, relevant für Suche`;

    const message = await this.anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      return this.defaultResult();
    }

    try {
      // Extrahiere JSON aus der Antwort
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return this.defaultResult();
      }

      const parsed = JSON.parse(jsonMatch[0]) as AnalysisResult;
      return {
        isImportant: Boolean(parsed.isImportant),
        type: this.validateType(parsed.type),
        summary: String(parsed.summary || '').substring(0, 200),
        tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 5).map(String) : [],
        confidence: Math.min(1, Math.max(0, Number(parsed.confidence) || 0)),
        context: parsed.context ? String(parsed.context).substring(0, 500) : undefined,
      };
    } catch {
      return this.defaultResult();
    }
  }

  private validateType(type: unknown): MemoryType {
    const validTypes: MemoryType[] = [
      'decision', 'fix', 'learning', 'pattern',
      'preference', 'config', 'error', 'context', 'conversation'
    ];
    return validTypes.includes(type as MemoryType) ? (type as MemoryType) : 'context';
  }

  private defaultResult(): AnalysisResult {
    return {
      isImportant: false,
      type: 'context',
      summary: '',
      tags: [],
      confidence: 0,
    };
  }

  private hashContent(content: string): string {
    // Einfacher Hash für Deduplizierung
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  /**
   * Manuelles Speichern (bypass Analyse)
   */
  async saveDirectly(
    content: string,
    type: MemoryType,
    tags: string[],
    source: MemorySource
  ): Promise<void> {
    const brain = getBrainClient();
    await brain.save({
      type,
      content,
      tags,
      source,
    });
  }

  /**
   * Konfiguration aktualisieren
   */
  updateConfig(config: Partial<AutoMemoryConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Status abrufen
   */
  getStatus(): { config: AutoMemoryConfig; sessionCounts: Record<string, number> } {
    return {
      config: this.config,
      sessionCounts: Object.fromEntries(this.sessionEntries),
    };
  }
}

// Singleton
let middleware: AutoMemoryMiddleware | null = null;

export function getAutoMemory(): AutoMemoryMiddleware {
  if (!middleware) {
    middleware = new AutoMemoryMiddleware({
      enabled: process.env.AUTO_MEMORY_ENABLED !== 'false',
      minConfidence: Number(process.env.AUTO_MEMORY_MIN_CONFIDENCE) || 0.7,
    });
  }
  return middleware;
}
