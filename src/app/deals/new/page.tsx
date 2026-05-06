import { redirect } from "next/navigation";
import { Nav } from "@/components/nav";
import { getUser } from "@/lib/auth";
import { hasActiveSubscription } from "@/lib/subscription";
import { DealSetup } from "@/components/deals/deal-setup";

export const metadata = {
  title: "Set Up Your Deal — Tether",
  description: "Create your due diligence workspace. Add deal details, build your team, and launch.",
};

export default async function NewDealPage() {
  const user = await getUser();
  if (!user) redirect("/login?next=/deals/new");
  const subscribed = await hasActiveSubscription(user.id);
  if (!subscribed) redirect("/pricing");

  return (
    <>
      <Nav />
      <DealSetup />
    </>
  );
}
