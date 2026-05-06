import { redirect } from "next/navigation";
import { Nav } from "@/components/nav";
import { getUser } from "@/lib/auth";
import { hasActiveSubscription } from "@/lib/subscription";
import { PipelineDashboard } from "@/components/pipeline/pipeline-dashboard";

export const metadata = {
  title: "Deal Pipeline — Tether",
  description: "Track, compare, and advance every acquisition opportunity in your pipeline.",
};

export default async function PipelinePage() {
  const user = await getUser();
  if (!user) redirect("/login?next=/pipeline");
  const subscribed = await hasActiveSubscription(user.id);
  if (!subscribed) redirect("/pricing");

  return (
    <>
      <Nav />
      <PipelineDashboard />
    </>
  );
}
