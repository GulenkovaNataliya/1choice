import { type NextRequest, NextResponse } from "next/server";
import { parseCriteria, searchProperties } from "@/lib/chat/propertySearch";

// ── Dev/staging only — not exposed in production ──────────────────────────────
export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  try {
    const { message } = await req.json();
    if (typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

    const criteria = await parseCriteria(message);   // parseCriteria is async
    const result   = await searchProperties(criteria);

    return NextResponse.json({
      criteria,
      resultsCount: result.results.length,
      isExact:      result.isExact,
      sample:       result.results.slice(0, 2),
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
