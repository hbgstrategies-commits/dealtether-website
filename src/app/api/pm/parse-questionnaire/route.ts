import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { isPMUser } from "@/lib/pm-auth";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const FIELDS_DESCRIPTION = `
Extract answers from this property management business questionnaire and return a JSON object with these exact keys (leave a key as "" if not found):

businessName - Legal business name
dba - Doing business as / trade name
website - Business website URL
city - City and state (e.g. "Phoenix, AZ")
yearsInBusiness - Number of years in business
exitTimeline - Owner's target exit timeline
ownerNames - Owner name(s)
ownerSalary - Owner annual salary or draw as a number (no $ sign)
competitiveEdge - What makes the business stand out
postSalePlans - What owner plans to do after selling
pmSoftware - Property management software used (AppFolio, Buildium, Rent Manager, Propertyware, Yardi, RealPage, DoorLoop, Hemlane, TenantCloud, or Other)
pmSoftwareOther - If software is "Other", the name
accountingSoftware - Accounting software (QuickBooks, Xero, etc.)
doors - Number of residential single-family doors as a number
hoaContracts - Number of HOA contracts as a number
hoaUnits - Total HOA units as a number
strProperties - Number of short-term rental (STR) properties as a number
commercialBuildings - Number of commercial buildings as a number
multiFamilyUnits - Number of multi-family units as a number
mgmtFee - Average management fee percentage as a number (just the number, e.g. 10)
ownerManagedProps - Number of owner-managed properties as a number
totalClients - Total number of clients/owners as a number
topClients - Top 3 clients description (name, units, revenue percentage)
ownerResponsibilities - Owner's primary day-to-day responsibilities
ownerHours - Hours per week owner works as a number
teamCount - Total number of team members/employees as a number
hasCallHandler - Whether there is a dedicated call handler (Yes, No, or Part-time)
hasSalesPerson - Whether there is a dedicated salesperson/BDM (Yes, No, or Owner handles sales)
keyStaff - Key team members with roles and tenure
orgNotes - Notes about operations, SOPs, systems
askPrice - Asking price as a number (no $ sign)
reasonForSelling - Reason for selling the business
documentsProvided - List of documents provided
generalNotes - Any other relevant notes

Return ONLY a valid JSON object. No markdown, no explanation. Start with { and end with }.`;

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isPMUser(user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, type, content } = await req.json() as { name: string; type: string; content: string };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parts: any[] = [{ type: "text", text: FIELDS_DESCRIPTION }];

    if (type === "application/pdf") {
      parts.push({
        type: "document",
        source: { type: "base64", media_type: "application/pdf", data: content },
      });
    } else {
      // Plain text / CSV / Word-extracted text
      parts.push({ type: "text", text: `\nDOCUMENT: ${name}\n\n${content}` });
    }

    const message = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2000,
      messages: [{ role: "user", content: parts }],
    });

    const text = message.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("")
      .replace(/```json|```/g, "")
      .trim();

    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Could not parse response");

    const parsed = JSON.parse(match[0]);
    return NextResponse.json({ fields: parsed });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
