import { notFound } from "next/navigation";
import { ValuationTool } from "@/components/valuation/valuation-tool";

export const metadata = { robots: { index: false } };

/** Ungated copy of Valuation 3.0 for local testing only — never served in production. */
export default async function ValuationPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ today?: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();
  const { today } = await searchParams;
  return (
    <main className="mx-auto max-w-4xl px-6 py-12 md:px-10">
      <ValuationTool today={today} />
    </main>
  );
}
