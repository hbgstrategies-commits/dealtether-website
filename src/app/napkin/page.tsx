import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { NapkinTool } from "@/components/napkin/napkin-tool";

export const metadata = {
  title: "Napkin Value",
  description:
    "Free AI-assisted napkin valuation. Weighted SDE, market-benchmarked multiples, risk-adjusted offer ranges, and year-one projections.",
};

export default function NapkinPage() {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-4xl px-6 py-12 md:px-10">
        <div className="mb-10 text-center">
          <span className="eyebrow-pill">Free tool</span>
          <h1 className="mt-5 text-[42px] font-bold tracking-tether-tight text-warm md:text-[48px]">
            Napkin Value
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-muted">
            Weighted SDE. Market-benchmarked multiple. Risk-adjusted offer
            range. In about 3 minutes.
          </p>
        </div>
        <NapkinTool />
      </main>
      <Footer />
    </>
  );
}
