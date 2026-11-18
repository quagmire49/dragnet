'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Finding, ScanLogEvent, Category, Severity } from '@/lib/types';
import { HEADLINE_FINDINGS, DEMO_SCAN_FINDINGS, DEMO_LOGS } from '@/lib/demo-data';

export type ScanStatus = 'idle' | 'scanning' | 'done';

interface ScanContextType {
  scanId: string | null;
  status: ScanStatus;
  selectedTags: string[];
  toggleTag: (tag: string) => void;
  findings: Finding[];
  visibleFindings: Finding[];
  activeFinding: Finding | null;
  setActiveFinding: (f: Finding | null) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  sortBy: 'risk' | 'file' | 'category';
  setSortBy: (s: 'risk' | 'file' | 'category') => void;
  healthScore: number;
  displayedScore: number;
  logs: ScanLogEvent[];
  isDryingDolly: boolean;
  ringFlashKey: number;
  triggerRingFlash: () => void;
  startScan: (repoUrl?: string) => Promise<void>;
  resetToLanding: () => void;
  isOffline: boolean;
  isCmdKOpen: boolean;
  setIsCmdKOpen: (open: boolean) => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;
  appliedFixIds: Set<string>;
  applyFix: (findingId: string) => void;
  selectedHotspotFile: string | null;
  setSelectedHotspotFile: (file: string | null) => void;
}

const ScanContext = createContext<ScanContextType | null>(null);

export const ALL_TAGS = [
  'ALL',
  'SECURITY',
  'SLOP',
  'GAPS',
  'LOOSE ENDS',
  'PYTHON',
  'TYPESCRIPT',
  'GO',
  'RUST',
  'JAVA',
];

export function ScanProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [scanId, setScanId] = useState<string | null>(null);
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [selectedTags, setSelectedTags] = useState<string[]>(['ALL']);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [activeFinding, setActiveFinding] = useState<Finding | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'risk' | 'file' | 'category'>('risk');
  const [healthScore, setHealthScore] = useState(0);
  const [displayedScore, setDisplayedScore] = useState(0);
  const [logs, setLogs] = useState<ScanLogEvent[]>([]);
  const [isDryingDolly, setIsDryingDolly] = useState(false);
  const [ringFlashKey, setRingFlashKey] = useState(0);
  const [isOffline, setIsOffline] = useState(false);
  const [isCmdKOpen, setIsCmdKOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [appliedFixIds, setAppliedFixIds] = useState<Set<string>>(new Set());
  const [selectedHotspotFile, setSelectedHotspotFile] = useState<string | null>(null);

  // Monitor network offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    if (typeof window !== 'undefined') {
      setIsOffline(!window.navigator.onLine);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  // Sync route with scan status
  useEffect(() => {
    if (pathname === '/') {
      setStatus('idle');
      setFindings([]);
      setActiveFinding(null);
      setHealthScore(0);
      setDisplayedScore(0);
      setLogs([]);
    } else if (pathname.startsWith('/scan/')) {
      const id = pathname.replace('/scan/', '');
      setScanId(id);
      if (status === 'idle') {
        // If loaded directly from URL, trigger or resume scan
        runScanReplay(id);
      }
    }
  }, [pathname]);

  // Score count-up animation over 1.2s
  useEffect(() => {
    if (status === 'done' && healthScore > 0) {
      let start = 0;
      const target = healthScore;
      const duration = 1200;
      const startTime = performance.now();

      const updateCount = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // easeOutQuad
        const current = Math.round(start + (target - start) * (1 - (1 - progress) * (1 - progress)));
        setDisplayedScore(current);
        if (progress < 1) {
          requestAnimationFrame(updateCount);
        }
      };

      requestAnimationFrame(updateCount);
    } else if (status === 'idle') {
      setDisplayedScore(0);
    }
  }, [status, healthScore]);

  const triggerRingFlash = useCallback(() => {
    setRingFlashKey((k) => k + 1);
  }, []);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 2800);
  }, []);

  const applyFix = useCallback((findingId: string) => {
    setAppliedFixIds((prev) => new Set(prev).add(findingId));
    const target = DEMO_SCAN_FINDINGS.find((f) => f.id === findingId) || activeFinding;
    if (target?.fix_diff && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(target.fix_diff);
      showToast('FIX PATCH APPLIED & COPIED TO CLIPBOARD');
    } else {
      showToast('FIX PATCH APPLIED TO LOCAL WORKSPACE');
    }
  }, [activeFinding, showToast]);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) => {
      if (tag === 'ALL') return ['ALL'];
      const filtered = prev.filter((t) => t !== 'ALL');
      if (filtered.includes(tag)) {
        const next = filtered.filter((t) => t !== tag);
        return next.length === 0 ? ['ALL'] : next;
      } else {
        return [...filtered, tag];
      }
    });
  }, []);

  const runScanReplay = useCallback(async (id: string) => {
    setStatus('scanning');
    setFindings([]);
    setLogs([]);
    setHealthScore(0);

    // Stream logs & findings progressively
    const totalSteps = DEMO_LOGS.length;
    let findingIndex = 0;

    for (let i = 0; i < totalSteps; i++) {
      const demoLog = DEMO_LOGS[i];
      const newLog: ScanLogEvent = {
        ...demoLog,
        id: `log-${i}`,
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      };

      setLogs((prev) => [...prev, newLog]);

      // Add findings at specific stages
      if (i === 3 && findingIndex < 2) {
        // AWS Secret found
        setFindings((prev) => [...prev, DEMO_SCAN_FINDINGS[1]]);
        findingIndex = 2;
      } else if (i === 5 && findingIndex < 3) {
        // SQL injection found
        setFindings((prev) => [...prev, DEMO_SCAN_FINDINGS[2]]);
        findingIndex = 3;
      } else if (i === 7 && findingIndex < 4) {
        // Hallucinated import found!
        setFindings((prev) => [...prev, DEMO_SCAN_FINDINGS[0]]);
        findingIndex = 4;
        setRingFlashKey((k) => k + 1);
      } else if (i === 8) {
        // Remaining findings pop in
        setFindings(DEMO_SCAN_FINDINGS.slice(0, 8));
      } else if (i === 10) {
        setFindings(DEMO_SCAN_FINDINGS);
      }

      // Stagger stream delay
      await new Promise((r) => setTimeout(r, 260));
    }

    // Scan complete
    setStatus('done');
    setHealthScore(38);
  }, []);

  const startScan = useCallback(
    async (repoUrl: string = 'https://github.com/dragnet-audit/demo-vulnerable-repo') => {
      const id = 'scan-' + Math.random().toString(36).substring(2, 9);
      setScanId(id);
      setIsDryingDolly(true);

      // 700ms camera dolly-in transition before navigating
      setTimeout(() => {
        setIsDryingDolly(false);
        router.push(`/scan/${id}`);
        runScanReplay(id);
      }, 700);
    },
    [router, runScanReplay]
  );

  const resetToLanding = useCallback(() => {
    setStatus('idle');
    setFindings([]);
    setActiveFinding(null);
    setSelectedHotspotFile(null);
    router.push('/');
  }, [router]);

  // Filtered and sorted findings
  const visibleFindings = useMemo(() => {
    let list = [...findings];

    if (selectedHotspotFile) {
      list = list.filter((f) => f.file === selectedHotspotFile);
    }

    if (!selectedTags.includes('ALL')) {
      list = list.filter((f) => {
        const catMatch =
          (selectedTags.includes('SECURITY') && f.category === 'security') ||
          (selectedTags.includes('SLOP') && f.category === 'slop') ||
          (selectedTags.includes('GAPS') && f.category === 'gap') ||
          (selectedTags.includes('LOOSE ENDS') && f.category === 'loose_end');

        const langMatch =
          f.language &&
          ((selectedTags.includes('PYTHON') && f.language.toLowerCase() === 'python') ||
            (selectedTags.includes('TYPESCRIPT') && f.language.toLowerCase() === 'typescript') ||
            (selectedTags.includes('GO') && f.language.toLowerCase() === 'go') ||
            (selectedTags.includes('RUST') && f.language.toLowerCase() === 'rust') ||
            (selectedTags.includes('JAVA') && f.language.toLowerCase() === 'java'));

        return catMatch || langMatch;
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (f) =>
          f.rule.toLowerCase().includes(q) ||
          f.title.toLowerCase().includes(q) ||
          f.file.toLowerCase().includes(q) ||
          f.explanation.toLowerCase().includes(q)
      );
    }

    // Sort order
    if (sortBy === 'risk') {
      const rank: Record<Severity, number> = {
        critical: 4,
        high: 3,
        medium: 2,
        low: 1,
        info: 0,
      };
      list.sort((a, b) => rank[b.severity] - rank[a.severity] || b.confidence - a.confidence);
    } else if (sortBy === 'file') {
      list.sort((a, b) => a.file.localeCompare(b.file));
    } else if (sortBy === 'category') {
      list.sort((a, b) => a.category.localeCompare(b.category));
    }

    return list;
  }, [findings, selectedTags, searchQuery, sortBy, selectedHotspotFile]);

  // Trigger ring flash if hallucinated package is selected
  useEffect(() => {
    if (activeFinding?.isHallucinated || activeFinding?.rule === 'hallucinated-import') {
      triggerRingFlash();
    }
  }, [activeFinding, triggerRingFlash]);

  return (
    <ScanContext.Provider
      value={{
        scanId,
        status,
        selectedTags,
        toggleTag,
        findings,
        visibleFindings,
        activeFinding,
        setActiveFinding,
        searchQuery,
        setSearchQuery,
        sortBy,
        setSortBy,
        healthScore,
        displayedScore,
        logs,
        isDryingDolly,
        ringFlashKey,
        triggerRingFlash,
        startScan,
        resetToLanding,
        isOffline,
        isCmdKOpen,
        setIsCmdKOpen,
        toastMessage,
        showToast,
        appliedFixIds,
        applyFix,
        selectedHotspotFile,
        setSelectedHotspotFile,
      }}
    >
      {children}
    </ScanContext.Provider>
  );
}

export function useScan() {
  const ctx = useContext(ScanContext);
  if (!ctx) {
    throw new Error('useScan must be used within ScanProvider');
  }
  return ctx;
}
