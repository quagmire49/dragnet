import { Finding, Severity } from './types';

export function generateSarifReport(findings: Finding[]): string {
  const levelMap: Record<Severity, string> = {
    critical: 'error',
    high: 'error',
    medium: 'warning',
    low: 'note',
    info: 'note',
  };

  const sarif = {
    $schema: 'https://docs.oasis-open.org/sarif/sarif/v2.1.0/cos02/schemas/sarif-schema-2.1.0.json',
    version: '2.1.0',
    runs: [
      {
        tool: {
          driver: {
            name: 'Dragnet',
            version: '1.0.0',
            informationUri: 'https://github.com/quagmire49',
            rules: Array.from(new Set(findings.map((f) => f.rule))).map((rule) => {
              const sample = findings.find((f) => f.rule === rule);
              return {
                id: rule,
                name: sample?.title || rule,
                shortDescription: {
                  text: sample?.title || rule,
                },
                fullDescription: {
                  text: sample?.explanation || '',
                },
                defaultConfiguration: {
                  level: levelMap[sample?.severity || 'low'],
                },
              };
            }),
          },
        },
        results: findings.map((f) => ({
          ruleId: f.rule,
          level: levelMap[f.severity],
          message: {
            text: `${f.title}: ${f.explanation}`,
          },
          locations: [
            {
              physicalLocation: {
                artifactLocation: {
                  uri: f.file,
                  uriBaseId: '%SRCROOT%',
                },
                region: {
                  startLine: f.line_start,
                  endLine: f.line_end || f.line_start,
                },
              },
            },
          ],
        })),
      },
    ],
  };

  return JSON.stringify(sarif, null, 2);
}
