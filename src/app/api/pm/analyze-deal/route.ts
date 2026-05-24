import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { isPMUser } from "@/lib/pm-auth";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isPMUser(user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { questionnaire, years, businessName } = await req.json() as {
      questionnaire: Record<string, string>;
      years: { label: string; revenue: number; sde: number }[];
      businessName: string;
    };

    const q = questionnaire ?? {};
    const financialSummary = years.length > 0
      ? years.map((y) => `${y.label}: Revenue $${y.revenue.toLocaleString()}, SDE $${y.sde.toLocaleString()}, Margin ${y.revenue > 0 ? ((y.sde / y.revenue) * 100).toFixed(1) : "0.0"}%`).join("\n")
      : "No financial data provided";

    // Revenue trend
    let revTrend = "";
    if (years.length >= 2) {
      const first = years[0].revenue, last = years[years.length - 1].revenue;
      const pct = first > 0 ? (((last - first) / first) * 100).toFixed(1) : "n/a";
      revTrend = `Revenue trend: ${first > last ? "declining" : "growing"} ${pct}% over ${years.length} years.`;
    }

    const prompt = `You are a senior acquisition analyst specializing in property management company valuations. Score this deal's qualitative and risk factors based on the available data.

BUSINESS: ${businessName}

FINANCIAL DATA:
${financialSummary}
${revTrend}

QUESTIONNAIRE:
- PM Software: ${q.pmSoftware || "not specified"}${q.pmSoftwareOther ? ` (${q.pmSoftwareOther})` : ""}
- Years in Business: ${q.yearsInBusiness || "unknown"}
- Doors (SFR): ${q.doors || "unknown"}
- HOA Contracts: ${q.hoaContracts || "0"}, HOA Units: ${q.hoaUnits || "0"}
- STR Properties: ${q.strProperties || "0"}
- Mgmt Fee %: ${q.mgmtFee || "unknown"}
- Total Clients: ${q.totalClients || "unknown"}
- Top Clients: ${q.topClients || "not specified"}
- Owner Hours/Week: ${q.ownerHours || "unknown"}
- Owner Responsibilities: ${q.ownerResponsibilities || "not specified"}
- Team Count: ${q.teamCount || "unknown"}
- Has Call Handler: ${q.hasCallHandler || "unknown"}
- Has Salesperson/BDM: ${q.hasSalesPerson || "unknown"}
- Key Staff: ${q.keyStaff || "not specified"}
- Accounting Software: ${q.accountingSoftware || "not specified"}
- Competitive Edge: ${q.competitiveEdge || "not specified"}
- Reason for Selling: ${q.reasonForSelling || "not specified"}
- Exit Timeline: ${q.exitTimeline || "not specified"}
- Owner Post-Sale Plans: ${q.postSalePlans || "not specified"}
- Org Notes: ${q.orgNotes || "none"}

Score each factor. Return ONLY a valid JSON object (no markdown, no explanation):

{
  "qSystems": { "score": <1-5>, "reason": "<one concise sentence>" },
  "qTeam": { "score": <1-5>, "reason": "<one concise sentence>" },
  "qPortfolio": { "score": <1-5>, "reason": "<one concise sentence>" },
  "qGrowth": { "score": <1-5>, "reason": "<one concise sentence>" },
  "qBrand": { "score": <1-5>, "reason": "<one concise sentence>" },
  "rOwnerDep": { "score": <0-5>, "reason": "<one concise sentence>" },
  "rClientConc": { "score": <0-5>, "reason": "<one concise sentence>" },
  "rPortfolioQuality": { "score": <0-5>, "reason": "<one concise sentence>" },
  "rStaffRetention": { "score": <0-5>, "reason": "<one concise sentence>" },
  "rMarket": { "score": <0-5>, "reason": "<one concise sentence>" }
}

SCORING GUIDE:
Quality (qSystems, qTeam, qPortfolio, qGrowth, qBrand): 1=poor, 2=below avg, 3=average, 4=good, 5=excellent
Risk (rOwnerDep, rClientConc, rPortfolioQuality, rStaffRetention, rMarket): 0=none, 1=minimal, 2=low, 3=moderate, 4=high, 5=critical

Key signals to look for:
- qSystems: named PM software + accounting software = good; AppFolio/Buildium = best; vague/none = poor
- qTeam: team count vs. doors ratio, dedicated call handler, BDM presence, key staff depth
- qPortfolio: HOA + long-term mix = stable; STR-heavy = volatile; door count and client count balance
- qGrowth: revenue trend over years, margin consistency, growing vs. declining
- qBrand: years in business, competitive edge, referral mentions
- rOwnerDep: owner hours/week + sole-operator signals vs. delegated operations
- rClientConc: top clients % of revenue; any single client >20% = high risk
- rPortfolioQuality: STR mix, owner-managed props, any problem signals
- rStaffRetention: key staff tenure, owner-dependent ops, team depth
- rMarket: market size, geography, regulatory environment
If data is insufficient for a factor, use 3 for quality or 2 for risk.`;

    const message = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1200,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("")
      .replace(/```json|```/g, "")
      .trim();

    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Could not parse AI response");

    const scores = JSON.parse(match[0]);
    return NextResponse.json({ scores });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
