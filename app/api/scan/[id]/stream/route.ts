import { DEMO_SCAN_FINDINGS, DEMO_LOGS } from '@/lib/demo-data';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const encoder = new TextEncoder();

  const customStream = new ReadableStream({
    async start(controller) {
      const sendEvent = (type: string, data: any) => {
        controller.enqueue(
          encoder.encode(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      // Stream logs and findings
      for (let i = 0; i < DEMO_LOGS.length; i++) {
        const log = DEMO_LOGS[i];
        sendEvent('log', {
          id: `log-${i}`,
          stage: log.stage,
          message: log.message,
          status: log.status,
          detail: log.detail,
          timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
        });

        // Correlate findings
        if (i === 3) {
          sendEvent('finding', DEMO_SCAN_FINDINGS[1]); // AWS Key
        } else if (i === 5) {
          sendEvent('finding', DEMO_SCAN_FINDINGS[2]); // SQLi
        } else if (i === 7) {
          sendEvent('finding', DEMO_SCAN_FINDINGS[0]); // Hallucinated
        } else if (i === 8) {
          DEMO_SCAN_FINDINGS.slice(3, 7).forEach((f) => sendEvent('finding', f));
        } else if (i === 10) {
          DEMO_SCAN_FINDINGS.slice(7).forEach((f) => sendEvent('finding', f));
        }

        await new Promise((r) => setTimeout(r, 220));
      }

      sendEvent('done', {
        healthScore: 38,
        findingsCount: DEMO_SCAN_FINDINGS.length,
      });

      controller.close();
    },
  });

  return new Response(customStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
