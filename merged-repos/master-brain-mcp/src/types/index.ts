// Master Brain MCP Hub - Type Definitions

export interface BrainEntry {
  id: string;
  type: MemoryType;
  content: string;
  summary?: string;
  tags: string[];
  source: MemorySource;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export type MemoryType =
  | 'decision'      // Architektur-/Design-Entscheidungen
  | 'fix'           // Bug-Fixes und Lösungen
  | 'learning'      // Gelerntes, Best Practices
  | 'pattern'       // Code-Patterns
  | 'preference'    // User-Präferenzen
  | 'config'        // Konfigurationen
  | 'error'         // Fehler und deren Ursachen
  | 'context'       // Projekt-Kontext
  | 'conversation'; // Wichtige Konversations-Ausschnitte

export interface MemorySource {
  tool: 'claude-code' | 'codex' | 'cursor' | 'api' | 'manual';
  session_id?: string;
  project?: string;
  file?: string;
  user_id?: string;
}

export interface AnalysisResult {
  isImportant: boolean;
  type: MemoryType;
  summary: string;
  tags: string[];
  confidence: number;
  context?: string;
}

export interface SearchResult {
  entries: BrainEntry[];
  total: number;
  query: string;
  mode: 'semantic' | 'keyword' | 'hybrid';
}

export interface BrainStats {
  totalEntries: number;
  entriesByType: Record<MemoryType, number>;
  entriesBySource: Record<string, number>;
  lastUpdated: Date;
  storageSize: string;
}

export interface AutoMemoryConfig {
  enabled: boolean;
  minConfidence: number;        // Minimum confidence to save (0-1)
  excludeTypes: MemoryType[];   // Types to never auto-save
  maxEntriesPerSession: number; // Rate limiting
  deduplicationWindow: number;  // Minutes to check for duplicates
}

export interface MCPToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}
