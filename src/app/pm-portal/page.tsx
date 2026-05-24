import { redirect } from "next/navigation";
import { Nav } from "@/components/nav";
import { getUser } from "@/lib/auth";
import { isPMUser } from "@/lib/pm-auth";
import { PMDashboard } from "@/components/pm-portal/pm-dashboard";

export const metadata = {
  title: "PM Portal — Tether",
  description: "Private property management acquisition portal.",
};

export default async function PMPortalPage() {
  const user = await getUser();
  if (!user) redirect("/login?next=/pm-portal");
  if (!isPMUser(user.email)) redirect("/dashboard");

  return (
    <>
      <Nav />
      <div style={{ maxWidth: 1060, margin: "0 auto", padding: "1.5rem 1.25rem 4rem" }}>
        <PMDashboard />
      </div>
    </>
  );
}
