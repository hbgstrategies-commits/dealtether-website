export function CredibilityBar() {
  return (
    <div className="border-y border-[0.5px] border-border bg-navy-100 px-10 py-6">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-8">
        <Stat num="$60M+" label="in acquisitions closed" />
        <Divider />
        <Stat num="$20M+" label="in SBA loans funded" />
        <Divider />
        <Stat num="3" label="tools built from real deals" />
        <Divider />
        <p className="max-w-md flex-1 text-center text-sm italic leading-relaxed text-muted">
          <strong className="not-italic text-warm">
            This isn&apos;t software built by engineers who read about
            acquisitions.
          </strong>{" "}
          Every stage of Tether came from real deals — the mistakes, the
          near-misses, and the systems developed over $60M+ in closed
          transactions.
        </p>
      </div>
    </div>
  );
}

function Stat({ num, label }: { num: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-[26px] font-bold tracking-tether-tight text-teal">
        {num}
      </div>
      <div className="mt-0.5 text-xs text-muted">{label}</div>
    </div>
  );
}

function Divider() {
  return <div className="h-10 w-px bg-border" />;
}
