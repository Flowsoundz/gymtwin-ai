import { NextResponse } from "next/server";

function formatMegabytes(bytes: number) {
  return Number((bytes / (1024 * 1024)).toFixed(2));
}

export async function POST(request: Request) {
  if (process.env.GYMTWIN_DEBUG_DIAGNOSTICS !== "1") {
    return NextResponse.json({ ok: false, reason: "disabled" }, { status: 404 });
  }

  const clientDiagnostics = (await request.json()) as Record<string, unknown>;
  const memory = process.memoryUsage();

  const logPayload = {
    receivedAt: new Date().toISOString(),
    memoryMB: {
      rss: formatMegabytes(memory.rss),
      heapTotal: formatMegabytes(memory.heapTotal),
      heapUsed: formatMegabytes(memory.heapUsed),
      external: formatMegabytes(memory.external),
      arrayBuffers: formatMegabytes(memory.arrayBuffers),
    },
    clientDiagnostics,
  };

  console.info("[GymTwinMemory]", JSON.stringify(logPayload));

  return NextResponse.json({ ok: true });
}

export async function GET() {
  if (process.env.GYMTWIN_DEBUG_DIAGNOSTICS !== "1") {
    return NextResponse.json({ ok: false, reason: "disabled" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    terminalOnly: true,
  });
}
