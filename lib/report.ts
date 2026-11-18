import { Finding } from './types';

export function generateMarkdownReport(findings: Finding[], healthScore: number): string {
  const date = new Date().toISOString();
  const criticals = findings.filter((f) => f.severity === 'critical');
  const highs = findings.filter((f) => f.severity === 'high');
  const mediums = findings.filter((f) => f.severity === 'medium');
  const lows = findings.filter((f) => f.severity === 'low');

  return `# DRAGNET CODE AUDIT REPORT

**Generated:** ${date}  
**Overall Health Score:** ${healthScore} / 100  
**Status:** Audit Complete  

---

## Executive Summary

Dragnet scanned the codebase for security vulnerabilities, AI slop, structural gaps, and loose ends.
A total of **${findings.length} findings** were identified across **14 extensions**.

- **Critical:** ${criticals.length}
- **High:** ${highs.length}
- **Medium:** ${mediums.length}
- **Low / Info:** ${lows.length}

---

## Findings Breakdown

${findings
  .map(
    (f, idx) => `
### ${idx + 1}. [${f.severity.toUpperCase()}] ${f.title}

- **Rule:** \`${f.rule}\`
- **Category:** ${f.category}
- **Location:** \`${f.file}:${f.line_start}\`
- **Confidence:** ${(f.confidence * 100).toFixed(0)}%
- **Engine:** ${f.source}
${f.isHallucinated ? '- **Alert:** PACKAGE DOES NOT EXIST ON NPM/PYPI (SLOPSQUATTING RISK)' : ''}

**Explanation:**  
${f.explanation}

\`\`\`
${f.snippet}
\`\`\`

${
  f.fix_diff
    ? `**Suggested Remediation Patch:**  
\`\`\`diff
${f.fix_diff}
\`\`\``
    : '_No automated diff patch available. Resolve manually._'
}
`
  )
  .join('\n\n---\n')}
`;
}
