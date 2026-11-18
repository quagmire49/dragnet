import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const repoUrl = body.repoUrl || 'https://github.com/dragnet-audit/demo-vulnerable-repo';
    const jobId = 'scan-' + Math.random().toString(36).substring(2, 9);

    return NextResponse.json({
      job_id: jobId,
      repo_url: repoUrl,
      status: 'queued',
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create scan job' }, { status: 500 });
  }
}
