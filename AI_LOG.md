# AI Development & Triage Log (AI_LOG.md)

**Project:** DRAGNET — Architecture-Agnostic Code Auditor Agent  
**Track:** AI Triage / AntiSlop  
**Repository:** https://github.com/quagmire49/dragnet  
**Date:** 18 November 2026  

---

## 1. System Vision & Objective

As generative AI models (Copilot, ChatGPT, Claude) accelerate code production across software teams, codebases are increasingly polluted with **AI slop**:
1. **Hallucinated Package Imports (Slopsquatting):** LLMs invent plausible-sounding libraries (e.g. `fastjson_utils_pro`) that do not exist on public package registries (PyPI, npm). Attackers actively monitor or generate these names to register malicious packages, resulting in supply-chain compromises.
2. **Duplicated & Stale Code:** Large blocks of copy-pasted logic generated without awareness of existing helper functions.
3. **Empty Handlers & Stubs:** AI-written placeholder functions with `except Exception: pass` or `// TODO` markers silently swallowing production runtime failures.
4. **Hardcoded Secrets & SQL Injections:** Insecure default boilerplate copied directly into production branches.

**Dragnet** was engineered to ingest any repository, inventory its files and abstract syntax trees (AST), execute parallel static and registry heuristics, and employ targeted **AI Triage** to deduplicate, rate severity, explain root causes, and synthesize immediate unified diff patches.

---

## 2. AI Triage Pipeline & Architecture

### 2.1 Multi-Stage Pipeline
```
[Repository Ingestion]
         │
         ▼
[AST & Heuristic Analysis] (Tree-sitter, PyPI Registry, Regex, OSV.dev)
         │
         ▼
[Raw Finding Collection] (Candidate vulnerabilities & slop patterns)
         │
         ▼
[AI Triage Layer]
  ├── De-duplication across files
  ├── False-positive rejection (excluding test mocks & fixtures)
  ├── Severity classification (Critical / High / Medium / Low)
  └── Plain-English explanation generation
         │
         ▼
[Automated Patch Synthesis] (Unified diff generation ready for git apply)
         │
         ▼
[Real-Time SSE Streaming] (Live WebSocket/SSE push to WebGL Command Console)
```

### 2.2 Triage Prompt Specification
Candidate findings are collected in batches of 15–20 items with $\pm 10$ lines of AST code context:
```json
{
  "finding_id": "f-101",
  "rule": "hallucinated-import",
  "file": "src/utils/parser.py",
  "line": 14,
  "raw_snippet": "import fastjson_utils_pro as fjson",
  "registry_status": "HTTP 404 (Not Found on pypi.org)"
}
```

The triage model evaluates the AST context and emits structured JSON:
```json
{
  "keep": true,
  "severity": "critical",
  "confidence": 0.98,
  "category": "slop",
  "title": "UNREGISTERED PYPI PACKAGE: FASTJSON_UTILS_PRO",
  "explanation": "AI code assistant imported a non-existent package. An attacker can register this identifier on PyPI to execute remote code on your build workers (slopsquatting risk).",
  "fix_diff": "--- a/src/utils/parser.py\n+++ b/src/utils/parser.py\n@@ -14,2 +14,2 @@\n-import fastjson_utils_pro as fjson\n+import json as fjson"
}
```

---

## 3. AntiSlop & Slopsquatting Detection Heuristic

The flagship detection feature addresses **hallucinated imports**:
1. AST parsing walks all `Import` and `ImportFrom` nodes across Python and JavaScript/TypeScript files.
2. Standard library modules (`os`, `sys`, `json`, `math`, etc.) are filtered out via an in-memory set.
3. The root package identifier is queried against public registry endpoints:
   - **PyPI:** `https://pypi.org/pypi/{name}/json`
   - **npm:** `https://registry.npmjs.org/{name}`
4. A **404 status code** indicates the package is non-existent on the registry — identifying it as an active hallucination and critical supply-chain vector.

---

## 4. UI/UX Interaction & GPGPU Visualization

To provide instant situational awareness, the application pairs the triage engine with an interactive WebGL command center:
* **GPGPU Ping-Pong Particle Field:** 262,144 particles simulated on the GPU via floating-point textures.
* **Scan Reactivity:**
  * Particle field accelerates during scan.
  * Incoming verified findings flash particles with their respective severity color.
  * Critical findings trigger a permanent severity tint floor.
  * Detection of a hallucinated package pulses a lavender-white ring burst.
* **Dashboard:** Health score calculation (0–100), ASCII breakdown bars, top hotspots, SARIF 2.1.0 and Markdown export.
* **Remediation Drawer:** Interactive side-by-side git diff viewer with a one-click `APPLY FIX` button.

---

## 5. Reproducibility & Verification

- **Node.js Production Build:** `npm run build` verifies clean static compilation across all routes with zero TypeScript errors.
- **Automated Verification Screenshots:** Captured via headless Chromium and persisted in `docs/screenshots/`.
- **Offline / Fallback Resilience:** Built-in cached demo replay ensures audit functionality remains reliable without external internet access.
