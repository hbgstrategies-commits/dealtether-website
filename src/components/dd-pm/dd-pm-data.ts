/**
 * Property Management Deal Workspace — seed data.
 *
 * This mirrors the full task list from legacy/dd-pm.html. Dates are
 * auto-distributed across the DD window at load time.
 */

export type PmRole =
  | "Buyer"
  | "Buyer Team"
  | "Operations Team"
  | "Acq. Team"
  | "Bank"
  | "Lawyer"
  | "Business Coach"
  | "CPA";

export type PmPriority = "high" | "medium" | "low";

export type PmTask = {
  task: string;
  role: PmRole;
  prog: 0 | 50 | 100;
  end: Date;
  priority: PmPriority;
  flagged: boolean;
  flagNote: string;
  notes: string;
  custom?: boolean;
};

export type PmPhase = { name: string; tasks: PmTask[] };

export type PmParticipant = { name: string; email: string; role: PmRole };

export const PM_ROLES: PmRole[] = [
  "Buyer",
  "Buyer Team",
  "Operations Team",
  "Acq. Team",
  "Bank",
  "Lawyer",
  "Business Coach",
  "CPA",
];

export const PM_ROLE_PILL: Record<PmRole, string> = {
  Buyer: "bg-[#E6F1FB] text-[#0C447C]",
  "Buyer Team": "bg-[#EEF0FE] text-[#2A3AB8]",
  "Operations Team": "bg-[#E1F5EE] text-[#085041]",
  "Acq. Team": "bg-[#FAEEDA] text-[#633806]",
  Bank: "bg-[#EEF8FF] text-[#0B4F7A]",
  Lawyer: "bg-[#FAECE7] text-[#712B13]",
  "Business Coach": "bg-[#F3EEF9] text-[#4A1875]",
  CPA: "bg-[#F0F9E8] text-[#2A5C0A]",
};

export const PM_ROLE_AVATAR: Record<PmRole, { bg: string; fg: string }> = {
  Buyer: { bg: "#E6F1FB", fg: "#0C447C" },
  "Buyer Team": { bg: "#EEF0FE", fg: "#2A3AB8" },
  "Operations Team": { bg: "#E1F5EE", fg: "#085041" },
  "Acq. Team": { bg: "#FAEEDA", fg: "#633806" },
  Bank: { bg: "#EEF8FF", fg: "#0B4F7A" },
  Lawyer: { bg: "#FAECE7", fg: "#712B13" },
  "Business Coach": { bg: "#F3EEF9", fg: "#4A1875" },
  CPA: { bg: "#F0F9E8", fg: "#2A5C0A" },
};

export const TODAY = new Date(2026, 3, 16);
export const WS = new Date(2026, 3, 14);
export const WE = new Date(2026, 3, 20);

type Seed = Omit<PmTask, "end"> & { end?: Date };

const PHASE_SEEDS: { name: string; tasks: Seed[] }[] = [
  {
    name: "Due Diligence Documents",
    tasks: [
      { task: "LOI Signed", role: "Buyer", prog: 100, priority: "high", flagged: false, flagNote: "", notes: "Signed and countersigned Mar 17." },
      { task: "Schedule weekly standing meeting", role: "Acq. Team", prog: 100, priority: "medium", flagged: false, flagNote: "", notes: "" },
      { task: "Receive Due Diligence documents", role: "Buyer", prog: 50, priority: "high", flagged: false, flagNote: "", notes: "" },
      { task: "3yrs taxes", role: "Buyer", prog: 0, priority: "high", flagged: true, flagNote: "2022 return shows unusual spike in owner compensation — needs explanation before financial analysis proceeds.", notes: "Requested from seller 3/17. Follow up sent 3/24." },
      { task: "3yrs PNL", role: "Buyer", prog: 50, priority: "high", flagged: false, flagNote: "", notes: "2023 and 2024 received. Still waiting on 2022." },
      { task: "3yrs Balance Sheet", role: "Buyer", prog: 0, priority: "high", flagged: false, flagNote: "", notes: "" },
      { task: "Current YTD financials", role: "Buyer", prog: 0, priority: "high", flagged: false, flagNote: "", notes: "" },
      { task: "Trailing 12-24mo monthly PNL", role: "Buyer", prog: 0, priority: "medium", flagged: false, flagNote: "", notes: "" },
      { task: "Business debt schedule", role: "Buyer", prog: 0, priority: "medium", flagged: false, flagNote: "", notes: "" },
      { task: "Complete Rent Roll", role: "Buyer", prog: 50, priority: "high", flagged: false, flagNote: "", notes: "" },
      { task: "All Management Agreements", role: "Buyer", prog: 0, priority: "high", flagged: true, flagNote: "3 agreements have non-assignment clauses. Seller must obtain written consent from those property owners before close.", notes: "" },
      { task: "All vendor & software agreements", role: "Buyer", prog: 0, priority: "medium", flagged: false, flagNote: "", notes: "" },
      { task: "View-only access to software", role: "Buyer", prog: 0, priority: "high", flagged: false, flagNote: "", notes: "" },
      { task: "Verification of security deposits", role: "Buyer", prog: 0, priority: "high", flagged: false, flagNote: "", notes: "" },
      { task: "Office space lease agreement", role: "Buyer", prog: 0, priority: "medium", flagged: false, flagNote: "", notes: "" },
      { task: "Org chart w/ roles & responsibilities", role: "Buyer", prog: 0, priority: "medium", flagged: false, flagNote: "", notes: "" },
      { task: "All employee agreements", role: "Buyer", prog: 0, priority: "medium", flagged: false, flagNote: "", notes: "" },
      { task: "Property inspection reports", role: "Buyer", prog: 0, priority: "medium", flagged: false, flagNote: "", notes: "" },
      { task: "Insurance policies", role: "Buyer", prog: 0, priority: "medium", flagged: false, flagNote: "", notes: "" },
      { task: "Litigation history", role: "Buyer", prog: 0, priority: "high", flagged: false, flagNote: "", notes: "" },
      { task: "Upload all documents to Google Folder", role: "Buyer", prog: 0, priority: "medium", flagged: false, flagNote: "", notes: "" },
    ],
  },
  {
    name: "Financing",
    tasks: [
      { task: "Interview 3 banks (Live Oak, Secondary, Local)", role: "Buyer", prog: 100, priority: "high", flagged: false, flagNote: "", notes: "Going with Live Oak Bank." },
      { task: "Choose a bank to work with", role: "Buyer", prog: 100, priority: "high", flagged: false, flagNote: "", notes: "" },
      { task: "Fill out Business Debt Schedule form", role: "Buyer", prog: 50, priority: "high", flagged: false, flagNote: "", notes: "" },
      { task: "Complete bank PreQual list", role: "Buyer", prog: 0, priority: "high", flagged: false, flagNote: "", notes: "" },
      { task: "Complete SBA form 413", role: "Buyer", prog: 0, priority: "high", flagged: false, flagNote: "", notes: "" },
      { task: "Complete SBA 7a form 1919", role: "Buyer", prog: 0, priority: "high", flagged: false, flagNote: "", notes: "" },
      { task: "Complete 24 month projection model", role: "Buyer", prog: 0, priority: "high", flagged: false, flagNote: "", notes: "" },
      { task: "Complete & submit underwriting requirements", role: "Buyer", prog: 0, priority: "high", flagged: false, flagNote: "", notes: "" },
      { task: "Solidify down payment requirements", role: "Buyer", prog: 0, priority: "high", flagged: false, flagNote: "", notes: "" },
      { task: "New bank accounts set up - if needed", role: "Bank", prog: 0, priority: "medium", flagged: false, flagNote: "", notes: "" },
      { task: "Funding completed", role: "Bank", prog: 0, priority: "high", flagged: false, flagNote: "", notes: "" },
    ],
  },
  {
    name: "Financial Analysis",
    tasks: [
      { task: "Familiarize w/line items in PNLs", role: "Buyer", prog: 50, priority: "high", flagged: false, flagNote: "", notes: "" },
      { task: "Quality of earnings assessment / add-backs", role: "Acq. Team", prog: 50, priority: "high", flagged: true, flagNote: "Add-backs appear inflated. Owner expensing personal vehicle + two family members on payroll. True SDE may be 15-20% lower than claimed.", notes: "Advisor reviewing normalized model this week." },
      { task: "What operating costs can be eliminated?", role: "Buyer", prog: 0, priority: "medium", flagged: false, flagNote: "", notes: "" },
      { task: "Review assets on balance sheet", role: "Acq. Team", prog: 0, priority: "medium", flagged: false, flagNote: "", notes: "" },
      { task: "Tax returns match PNLs", role: "Acq. Team", prog: 100, priority: "high", flagged: false, flagNote: "", notes: "Confirmed match on 2023 and 2024." },
      { task: "Any working capital needs? How much?", role: "Acq. Team", prog: 0, priority: "medium", flagged: false, flagNote: "", notes: "" },
      { task: "Complete Sources & Uses", role: "Buyer", prog: 0, priority: "high", flagged: false, flagNote: "", notes: "" },
    ],
  },
  {
    name: "Legal",
    tasks: [
      { task: "Identify transaction attorney", role: "Buyer", prog: 100, priority: "high", flagged: false, flagNote: "", notes: "Engaged Smith & Associates." },
      { task: "Ensure ALL contracts are assignable", role: "Buyer", prog: 0, priority: "high", flagged: false, flagNote: "", notes: "" },
      { task: "Lien search", role: "Lawyer", prog: 0, priority: "high", flagged: false, flagNote: "", notes: "" },
      { task: "Create entity (if needed)", role: "Lawyer", prog: 0, priority: "medium", flagged: false, flagNote: "", notes: "" },
      { task: "Complete any licensing requirements", role: "Buyer", prog: 0, priority: "high", flagged: false, flagNote: "", notes: "" },
      { task: "Review office lease & get approval of landlord", role: "Buyer", prog: 0, priority: "medium", flagged: false, flagNote: "", notes: "" },
      { task: "Review partnership agreement & approval to sell", role: "Lawyer", prog: 0, priority: "high", flagged: false, flagNote: "", notes: "" },
      { task: "Seller to prepare Disclosure Schedules before closing", role: "Lawyer", prog: 0, priority: "high", flagged: false, flagNote: "", notes: "" },
      { task: "Confirm deal terms", role: "Buyer", prog: 0, priority: "high", flagged: false, flagNote: "", notes: "" },
      { task: "Draft Purchase Agreement", role: "Lawyer", prog: 0, priority: "high", flagged: false, flagNote: "", notes: "" },
    ],
  },
  {
    name: "Operations",
    tasks: [
      { task: "View-only access review of software", role: "Operations Team", prog: 0, priority: "high", flagged: false, flagNote: "", notes: "" },
      { task: "Trust account review", role: "Operations Team", prog: 0, priority: "high", flagged: false, flagNote: "", notes: "" },
      { task: "Security deposit verification", role: "Operations Team", prog: 0, priority: "high", flagged: false, flagNote: "", notes: "" },
      { task: "Prepare software transition plan", role: "Operations Team", prog: 0, priority: "high", flagged: false, flagNote: "", notes: "" },
      { task: "Review management contracts - terms", role: "Buyer", prog: 0, priority: "high", flagged: false, flagNote: "", notes: "" },
      { task: "Review SOPs - if available", role: "Buyer", prog: 0, priority: "medium", flagged: false, flagNote: "", notes: "" },
      { task: "Build org chart - identify key personnel", role: "Buyer", prog: 0, priority: "medium", flagged: false, flagNote: "", notes: "" },
      { task: "Conduct physical portfolio inspection", role: "Buyer", prog: 0, priority: "high", flagged: false, flagNote: "", notes: "" },
      { task: "Identify underperforming properties", role: "Buyer", prog: 0, priority: "high", flagged: false, flagNote: "", notes: "" },
    ],
  },
  {
    name: "Marketing",
    tasks: [
      { task: "Review current marketing strategies", role: "Buyer", prog: 0, priority: "medium", flagged: false, flagNote: "", notes: "" },
      { task: "Website transition plan", role: "Operations Team", prog: 0, priority: "medium", flagged: false, flagNote: "", notes: "" },
      { task: "Who are the top clients?", role: "Buyer", prog: 0, priority: "high", flagged: false, flagNote: "", notes: "" },
      { task: "Create client retention plan — include seller", role: "Business Coach", prog: 0, priority: "high", flagged: false, flagNote: "", notes: "" },
      { task: "Business take-over 90-day plan", role: "Business Coach", prog: 0, priority: "high", flagged: false, flagNote: "", notes: "" },
    ],
  },
  {
    name: "Team",
    tasks: [
      { task: "Review employee agreements", role: "Buyer", prog: 0, priority: "medium", flagged: false, flagNote: "", notes: "" },
      { task: "Schedule meet-the-team", role: "Buyer", prog: 0, priority: "medium", flagged: false, flagNote: "", notes: "" },
      { task: "Interview key employees", role: "Buyer", prog: 0, priority: "medium", flagged: false, flagNote: "", notes: "" },
      { task: "Create new KPIs", role: "Buyer", prog: 0, priority: "medium", flagged: false, flagNote: "", notes: "" },
      { task: "Draft new employee agreements", role: "Lawyer", prog: 0, priority: "medium", flagged: false, flagNote: "", notes: "" },
    ],
  },
  {
    name: "Closing",
    tasks: [
      { task: "Final Go / No-Go Decision", role: "Buyer", prog: 0, priority: "high", flagged: false, flagNote: "", notes: "" },
      { task: "Prepare all final closing docs w/ lawyer", role: "Lawyer", prog: 0, priority: "high", flagged: false, flagNote: "", notes: "" },
      { task: "Schedule time and location for closing", role: "Buyer", prog: 0, priority: "high", flagged: false, flagNote: "", notes: "" },
      { task: "Closing", role: "Buyer", prog: 0, priority: "high", flagged: false, flagNote: "", notes: "" },
    ],
  },
  {
    name: "Transition — Month 1",
    tasks: [
      { task: "Software transition", role: "Operations Team", prog: 0, priority: "high", flagged: false, flagNote: "", notes: "" },
      { task: "Property onboardings", role: "Operations Team", prog: 0, priority: "high", flagged: false, flagNote: "", notes: "" },
      { task: "Client introductions", role: "Buyer", prog: 0, priority: "high", flagged: false, flagNote: "", notes: "" },
      { task: "Internal communication of acquisition", role: "Buyer Team", prog: 0, priority: "medium", flagged: false, flagNote: "", notes: "" },
      { task: "Accounting integration", role: "CPA", prog: 0, priority: "high", flagged: false, flagNote: "", notes: "" },
    ],
  },
  {
    name: "Transition — Month 2",
    tasks: [
      { task: "Vendor introductions", role: "Operations Team", prog: 0, priority: "medium", flagged: false, flagNote: "", notes: "" },
      { task: "CRM integration", role: "Buyer", prog: 0, priority: "medium", flagged: false, flagNote: "", notes: "" },
      { task: "Financial integration — set new benchmarks", role: "Buyer", prog: 0, priority: "high", flagged: false, flagNote: "", notes: "" },
      { task: "Cost optimizations", role: "Buyer", prog: 0, priority: "medium", flagged: false, flagNote: "", notes: "" },
    ],
  },
  {
    name: "Transition — Month 3",
    tasks: [
      { task: "Branding alignment", role: "Operations Team", prog: 0, priority: "medium", flagged: false, flagNote: "", notes: "" },
      { task: "Public announcement", role: "Operations Team", prog: 0, priority: "medium", flagged: false, flagNote: "", notes: "" },
      { task: "Financial performance review — track KPIs", role: "Buyer", prog: 0, priority: "high", flagged: false, flagNote: "", notes: "" },
      { task: "Client satisfaction survey", role: "Buyer Team", prog: 0, priority: "medium", flagged: false, flagNote: "", notes: "" },
    ],
  },
];

/**
 * Assign end dates — auto-distribute across the DD window + 90 days.
 * Matches legacy behavior; deterministic (no Math.random at render time).
 */
export function buildInitialPhases(): PmPhase[] {
  const base = new Date(2026, 3, 14).getTime();
  const total = PHASE_SEEDS.reduce((a, p) => a + p.tasks.length, 0);
  const phases: PmPhase[] = PHASE_SEEDS.map((ph) => ({
    name: ph.name,
    tasks: ph.tasks.map((seed) => ({ ...seed, end: new Date(0) })),
  }));

  let idx = 0;
  for (const ph of phases) {
    for (const t of ph.tasks) {
      const offset = Math.floor((idx / total) * 30);
      t.end = new Date(base + offset * 86400000);
      idx++;
    }
  }

  // Pin a handful of tasks to this week + overdue for demo feel
  const thisWeek: [number, number][] = [
    [0, 2], [0, 3], [0, 4], [0, 9], [1, 2], [1, 3], [2, 0], [2, 1], [3, 0], [3, 1],
  ];
  const overdue: [number, number][] = [[0, 3], [0, 10], [1, 0]];
  thisWeek.forEach(([pi, ti], i) => {
    const ph = phases[pi];
    if (ph?.tasks[ti]) ph.tasks[ti].end = new Date(2026, 3, 14 + (i % 5));
  });
  overdue.forEach(([pi, ti]) => {
    const ph = phases[pi];
    if (ph?.tasks[ti]) ph.tasks[ti].end = new Date(2026, 3, 10);
  });
  return phases;
}

export const INITIAL_PARTICIPANTS: PmParticipant[] = [
  { name: "Hunter Goodall", email: "hunter@example.com", role: "Buyer" },
  { name: "Sarah L.", email: "sarah@advisor.com", role: "Acq. Team" },
  { name: "Robert T.", email: "rt@law.com", role: "Lawyer" },
];

export function isThisWeek(t: PmTask) {
  return t.end >= WS && t.end <= WE;
}
export function isOverdue(t: PmTask) {
  return t.end < TODAY && t.prog < 100;
}
export function fmtDate(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
