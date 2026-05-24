import { redirect } from "next/navigation";
import { Nav } from "@/components/nav";
import { getUser } from "@/lib/auth";
import { isPMUser } from "@/lib/pm-auth";
import { PMDealDetail } from "@/components/pm-portal/pm-deal-detail";

export const metadata = {
  title: "Deal — PM Portal — Tether",
};

export default async function PMDealPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getUser();
  if (!user) redirect("/login?next=/pm-portal");
  if (!isPMUser(user.email)) redirect("/dashboard");

  return (
    <>
      <Nav />
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "1.5rem 1.25rem 4rem" }}>
        <PMDealDetail dealId={id} />
      </div>
    </>
  );
}
