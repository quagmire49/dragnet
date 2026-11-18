export type Category = 'security' | 'slop' | 'gap' | 'loose_end';
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface Finding {
  id: string;
  category: Category;
  severity: Severity;
  rule: string;
  title: string;
  explanation: string;
  file: string;
  line_start: number;
  line_end: number;
  snippet: string;
  confidence: number; // 0 - 1
  fix_diff: string | null;
  source: 'semgrep' | 'gitleaks' | 'tree-sitter' | 'llm' | 'osv';
  language?: string;
  isHallucinated?: boolean;
}

export type ScanStage = 
  | 'idle'
  | 'ingest'
  | 'inventory'
  | 'detect_secrets'
  | 'detect_rules'
  | 'detect_looseends'
  | 'detect_deps'
  | 'llm_triage'
  | 'scoring'
  | 'done';

export interface ScanLogEvent {
  id: string;
  timestamp: string;
  stage: ScanStage;
  message: string;
  status: 'OK' | '..' | 'RUNNING' | 'WARN';
  detail?: string;
}

export interface ScanJob {
  id: string;
  repoUrl: string;
  status: 'idle' | 'scanning' | 'done' | 'error';
  stage: ScanStage;
  findings: Finding[];
  logs: ScanLogEvent[];
  healthScore: number;
  filesScanned: number;
  linesOfCode: number;
  languages: { name: string; percentage: number; files: number }[];
  categoryCounts: Record<Category, number>;
  createdAt: string;
}

export const SEVERITY_COLORS: Record<Severity, string> = {
  critical: '#FF3B5C',
  high: '#FF8A3D',
  medium: '#FFD23D',
  low: '#3DA9FF',
  info: '#8a8a8a',
};
