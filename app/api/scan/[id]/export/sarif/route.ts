import { DEMO_SCAN_FINDINGS } from '@/lib/demo-data';
import { generateSarifReport } from '@/lib/sarif';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const sarif = generateSarifReport(DEMO_SCAN_FINDINGS);

  return new Response(sarif, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="dragnet-audit-${params.id}.sarif"`,
    },
  });
}
