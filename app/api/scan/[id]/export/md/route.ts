import { DEMO_SCAN_FINDINGS } from '@/lib/demo-data';
import { generateMarkdownReport } from '@/lib/report';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const content = generateMarkdownReport(DEMO_SCAN_FINDINGS, 38);

  return new Response(content, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="dragnet-audit-${params.id}.md"`,
    },
  });
}
