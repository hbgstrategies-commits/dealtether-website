import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  try {
    const { industry, location, radius } = await req.json();
    if (!industry || !location) {
      return NextResponse.json({ error: "industry and location required" }, { status: 400 });
    }

    const prompt = `You are a business sourcing assistant for an M&A acquisition tool called Tether (dealtether.com).

Find up to 15 real ${industry} businesses located within ${radius} miles of ${location}.

Use web search to find real companies with accurate details. For each business return:
- name: company name
- city: city, state
- distance: estimated miles from ${location} (e.g. "4.2 mi")
- website: website URL if known, else "—"
- rating: Google rating 1.0-5.0 (as a string like "4.3")
- reviews: approximate number of Google reviews (as a string like "87")
- trend: rating trend as "+0.3" or "-0.2" or "flat"
- years: years in business as a number (or null if unknown)
- revenue: estimated annual revenue range (e.g. "$1M – $3M") or "—"
- employees: estimated employee count (e.g. "8–12") or "—"
- owner: owner name if publicly findable, else "—"
- phone: business phone number if available, else "—"
- email: owner or business email if publicly available, else "—"
- notes: one short sentence with any acquisition signal (retiring owner, declining reviews, family business, outdated website, etc.) or ""

Return ONLY a valid JSON array. No markdown, no explanation. Start with [ and end with ].`;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const message = await (client.messages.create as any)({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 5000,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      messages: [{ role: "user", content: prompt }],
    });

    let text = "";
    for (const block of message.content ?? []) {
      if (block.type === "text") text += block.text;
    }

    const match = text.match(/\[[\s\S]*\]/);
    if (!match) {
      return NextResponse.json({ error: "No results returned from search" }, { status: 500 });
    }

    const parsed = JSON.parse(match[0]);
    const results = parsed.map((r: Record<string, unknown>) => ({
      ...r,
      status: "New",
      notes: r.notes ?? "",
    }));

    return NextResponse.json({ results });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
