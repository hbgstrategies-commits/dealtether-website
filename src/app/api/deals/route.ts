import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/deals — list all deals for the signed-in user
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("deals")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// Active stages count toward the 3-deal Solo limit
const ACTIVE_STAGES = ["sourcing", "discovery", "qoe", "valuation", "offer", "diligence", "Sourcing", "Discovery", "Valuation", "Offer", "Diligence"];
const SOLO_DEAL_LIMIT = 3;
const SOLO_DILIGENCE_LIMIT = 1;

// POST /api/deals — save a deal
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, stage, sde, multiple, asking_price, offer_low, offer_high, dscr, irr, notes } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Business name is required" }, { status: 400 });
  }

  // Enforce Solo plan limit: max 3 active deals
  const { count } = await supabase
    .from("deals")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .in("stage", ACTIVE_STAGES);

  if ((count ?? 0) >= SOLO_DEAL_LIMIT) {
    return NextResponse.json({
      error: `You've reached the 3-deal limit on the Solo plan. Remove a deal from your pipeline to add a new one.`,
      code: "DEAL_LIMIT",
    }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("deals")
    .insert({
      user_id: user.id,
      name: name.trim(),
      stage: stage ?? "Valuation",
      sde: sde ?? null,
      multiple: multiple ?? null,
      asking_price: asking_price ?? null,
      offer_low: offer_low ?? null,
      offer_high: offer_high ?? null,
      dscr: dscr ?? null,
      irr: irr ?? null,
      notes: notes ?? "",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

// PATCH /api/deals — update a deal
export async function PATCH(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, ...fields } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  // Enforce 1 active diligence limit when moving a deal to diligence
  if (fields.stage === "diligence") {
    const { count } = await supabase
      .from("deals")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("stage", "diligence")
      .neq("id", id);

    if ((count ?? 0) >= SOLO_DILIGENCE_LIMIT) {
      return NextResponse.json({
        error: "You already have a deal in due diligence. Complete or move it before starting another.",
        code: "DILIGENCE_LIMIT",
      }, { status: 403 });
    }
  }

  const { data, error } = await supabase
    .from("deals")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/deals — remove a deal
export async function DELETE(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { error } = await supabase
    .from("deals")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
