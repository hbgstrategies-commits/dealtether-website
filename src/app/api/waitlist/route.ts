import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST — join the waitlist
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase.from("training_waitlist").upsert({
    user_id: user.id,
    email: user.email!,
  }, { onConflict: "user_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// DELETE — leave the waitlist
export async function DELETE() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await supabase.from("training_waitlist").delete().eq("user_id", user.id);
  return NextResponse.json({ success: true });
}
