"use client";

import { useMemo, useState } from "react";
import { Flag, Plus } from "lucide-react";

/**
 * Deal Workspace — React port of legacy/dd-demo.html.
 *
 * Keeps the core interactions: phase-grouped task list, view filters,
 * task detail panel with progress/priority/owner/date editing, red-flag
 * notes, and a previewable weekly report.
 */

type Role = "Buyer" | "Deal Team" | "Ops Team" | "Advisor" | "Lawyer";
type Priority = "high" | "medium" | "low";
type View = "all" | "week" | "flags" | "high";

type Task = {
  task: string;
  role: Role;
  prog: 0 | 50 | 100;
  end: Date;
  priority: Priority;
  flagged: boolean;
  flagNote: string;
  notes: string;
  custom?: boolean;
};

type Phase = { name: string; tasks: Task[] };

const ROLES: Role[] = ["Buyer", "Deal Team", "Ops Team", "Advisor", "Lawyer"];
const TODAY = new Date(2026, 3, 16);
const WS = new Date(2026, 3, 14);
const WE = new Date(2026, 3, 20);

function isThisWeek(t: Task) {
  return t.end >= WS && t.end <= WE;
}
function isOverdue(t: Task) {
  return t.end < TODAY && t.prog < 100;
}
function fmtDate(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const INITIAL_PHASES: Phase[] = [
  {
    name: "Documents",
    tasks: [
      { task: "LOI Signed", role: "Buyer", prog: 100, end: new Date(2026, 2, 17), priority: "low", flagged: false, flagNote: "", notes: "Signed and countersigned Mar 17." },
      { task: "Schedule weekly standing meeting", role: "Deal Team", prog: 100, end: new Date(2026, 2, 18), priority: "low", flagged: false, flagNote: "", notes: "" },
      { task: "3yrs taxes", role: "Buyer", prog: 0, end: new Date(2026, 2, 23), priority: "high", flagged: true, flagNote: "2022 return shows unusual spike in owner comp — needs explanation before financial DD proceeds.", notes: "Requested from seller 3/17. Follow up sent 3/24." },
      { task: "3yrs PNL", role: "Buyer", prog: 50, end: new Date(2026, 2, 23), priority: "high", flagged: false, flagNote: "", notes: "2023 and 2024 received. Still waiting on 2022." },
      { task: "Complete Rent Roll", role: "Buyer", prog: 50, end: new Date(2026, 2, 23), priority: "high", flagged: false, flagNote: "", notes: "" },
      { task: "All Management Agreements", role: "Buyer", prog: 0, end: new Date(2026, 2, 23), priority: "medium", flagged: false, flagNote: "", notes: "" },
      { task: "Upload all documents to Google Drive", role: "Buyer", prog: 0, end: new Date(2026, 2, 23), priority: "low", flagged: false, flagNote: "", notes: "" },
    ],
  },
  {
    name: "Financing",
    tasks: [
      { task: "Interview and select a lender", role: "Buyer", prog: 100, end: new Date(2026, 2, 23), priority: "high", flagged: false, flagNote: "", notes: "Going with Live Oak Bank." },
      { task: "Complete SBA form 413", role: "Buyer", prog: 50, end: new Date(2026, 2, 22), priority: "high", flagged: false, flagNote: "", notes: "" },
      { task: "Complete 24 month projection model", role: "Buyer", prog: 0, end: new Date(2026, 2, 26), priority: "medium", flagged: false, flagNote: "", notes: "" },
      { task: "Submit underwriting requirements", role: "Buyer", prog: 0, end: new Date(2026, 3, 8), priority: "high", flagged: false, flagNote: "", notes: "" },
      { task: "Funding completed", role: "Buyer", prog: 0, end: new Date(2026, 3, 16), priority: "high", flagged: false, flagNote: "", notes: "" },
    ],
  },
  {
    name: "Financial DD",
    tasks: [
      { task: "Quality of earnings assessment", role: "Deal Team", prog: 50, end: new Date(2026, 2, 22), priority: "high", flagged: true, flagNote: "Add-backs look inflated. Owner expensing personal vehicle + two family members on payroll. True SDE may be 15–20% lower than claimed.", notes: "Advisor reviewing normalized model this week." },
      { task: "Tax returns match PNLs", role: "Deal Team", prog: 100, end: new Date(2026, 2, 19), priority: "high", flagged: false, flagNote: "", notes: "Confirmed match on 2023 and 2024." },
      { task: "Review assets on balance sheet", role: "Deal Team", prog: 0, end: new Date(2026, 2, 24), priority: "medium", flagged: false, flagNote: "", notes: "" },
      { task: "Complete Sources & Uses", role: "Buyer", prog: 0, end: new Date(2026, 3, 7), priority: "high", flagged: false, flagNote: "", notes: "" },
    ],
  },
  {
    name: "Legal DD",
    tasks: [
      { task: "Identify transaction attorney", role: "Buyer", prog: 100, end: new Date(2026, 2, 25), priority: "low", flagged: false, flagNote: "", notes: "Engaged Smith & Associates." },
      { task: "Ensure all contracts are assignable", role: "Buyer", prog: 0, end: new Date(2026, 2, 26), priority: "high", flagged: true, flagNote: "3 management agreements have non-assignment clauses. Seller must obtain written consent before close.", notes: "" },
      { task: "Lien search", role: "Lawyer", prog: 0, end: new Date(2026, 3, 11), priority: "high", flagged: false, flagNote: "", notes: "" },
      { task: "Confirm deal terms", role: "Buyer", prog: 0, end: new Date(2026, 3, 16), priority: "high", flagged: false, flagNote: "", notes: "" },
      { task: "Draft Purchase Agreement", role: "Lawyer", prog: 0, end: new Date(2026, 3, 19), priority: "high", flagged: false, flagNote: "", notes: "" },
    ],
  },
  {
    name: "Operations DD",
    tasks: [
      { task: "View-only access to software", role: "Ops Team", prog: 0, end: new Date(2026, 3, 9), priority: "high", flagged: false, flagNote: "", notes: "" },
      { task: "Trust account review", role: "Ops Team", prog: 0, end: new Date(2026, 3, 9), priority: "high", flagged: false, flagNote: "", notes: "" },
      { task: "Build org chart and identify key personnel", role: "Buyer", prog: 0, end: new Date(2026, 3, 8), priority: "medium", flagged: false, flagNote: "", notes: "" },
      { task: "Conduct portfolio inspection — random sample", role: "Buyer", prog: 0, end: new Date(2026, 3, 12), priority: "medium", flagged: false, flagNote: "", notes: "" },
    ],
  },
  {
    name: "Closing",
    tasks: [
      { task: "Final Go / No-Go Decision", role: "Buyer", prog: 0, end: new Date(2026, 3, 27), priority: "high", flagged: false, flagNote: "", notes: "" },
      { task: "Prepare all final closing docs", role: "Lawyer", prog: 0, end: new Date(2026, 4, 19), priority: "high", flagged: false, flagNote: "", notes: "" },
      { task: "Closing", role: "Buyer", prog: 0, end: new Date(2026, 4, 20), priority: "high", flagged: false, flagNote: "", notes: "" },
    ],
  },
];

export function DdDemoTool() {
  const [phases, setPhases] = useState<Phase[]>(INITIAL_PHASES);
  const [view, setView] = useState<View>("week");
  const [roleFilter, setRoleFilter] = useState<Role | "all">("all");
  const [phaseFilter, setPhaseFilter] = useState<string>("all");
  const [selected, setSelected] = useState<{ pi: number; ti: number } | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportDay, setReportDay] = useState("Thu");
  const [reportTime, setReportTime] = useState("8:00 AM");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const stats = useMemo(() => {
    let total = 0, done = 0, week = 0, flags = 0;
    for (const p of phases) {
      for (const t of p.tasks) {
        total++;
        if (t.prog >= 100) done++;
        if (isThisWeek(t)) week++;
        if (t.flagged) flags++;
      }
    }
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, done, week, flags, pct };
  }, [phases]);

  function updateTask(pi: number, ti: number, patch: Partial<Task>) {
    setPhases((prev) =>
      prev.map((ph, i) =>
        i !== pi ? ph : { ...ph, tasks: ph.tasks.map((t, j) => (j !== ti ? t : { ...t, ...patch })) }
      )
    );
  }

  function addTask(pi: number, task: Partial<Task> & { task: string }) {
    const end = task.end ?? new Date(TODAY.getTime() + 7 * 86400000);
    const newTask: Task = {
      task: task.task,
      role: task.role ?? "Buyer",
      prog: 0,
      end,
      priority: task.priority ?? "medium",
      flagged: false,
      flagNote: "",
      notes: "",
      custom: true,
    };
    setPhases((prev) =>
      prev.map((ph, i) => (i !== pi ? ph : { ...ph, tasks: [...ph.tasks, newTask] }))
    );
    toast("Task added");
  }

  function toast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2400);
  }

  function taskVisible(t: Task) {
    if (roleFilter !== "all" && t.role !== roleFilter) return false;
    if (view === "week" && !isThisWeek(t)) return false;
    if (view === "flags" && !t.flagged) return false;
    if (view === "high" && t.priority !== "high") return false;
    return true;
  }

  return (
    <div className="relative">
      {toastMsg && (
        <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-full bg-teal px-5 py-2 text-sm font-semibold text-navy shadow-lg">
          {toastMsg}
        </div>
      )}

      {/* Deal header */}
      <div className="mb-4 rounded-2xl border border-[0.5px] border-border bg-navy-100 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[11px] text-muted">Active deal</div>
            <div className="text-lg font-bold tracking-tether-tight text-warm">
              Apex Property Services
            </div>
          </div>
          <div className="rounded-lg bg-navy px-4 py-1.5 text-sm text-muted">
            <span className="font-semibold text-danger">18</span> days remaining in DD
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-6 text-xs">
          <div>
            <div className="text-muted">Start</div>
            <div className="font-medium text-warm">Mar 17, 2026</div>
          </div>
          <div>
            <div className="text-muted">DD deadline</div>
            <div className="font-medium text-warm">Apr 16, 2026</div>
          </div>
          <div>
            <div className="text-muted">Closing target</div>
            <div className="font-medium text-warm">May 28, 2026</div>
          </div>
        </div>
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs">
            <span className="text-muted">Overall deal progress</span>
            <span className="font-semibold text-warm">{stats.pct}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-navy">
            <div
              className="h-full bg-teal transition-all"
              style={{ width: `${stats.pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-4">
        <StatCard label="Total tasks" value={stats.total} />
        <StatCard label="Complete" value={stats.done} tone="teal" />
        <StatCard label="This week" value={stats.week} tone="blue" />
        <StatCard label="Flags / issues" value={stats.flags} tone="danger" />
      </div>

      {/* Report scheduler */}
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-[0.5px] border-border bg-navy-100 px-4 py-3">
        <span className="text-sm text-muted">Weekly report sends</span>
        <div className="flex gap-1">
          {["Mon", "Tue", "Wed", "Thu", "Fri"].map((d) => (
            <button
              key={d}
              onClick={() => setReportDay(d)}
              className={`rounded-md border border-[0.5px] px-2 py-1 text-xs ${
                reportDay === d
                  ? "border-teal-bd bg-teal-bg text-teal"
                  : "border-border text-muted"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
        <select
          value={reportTime}
          onChange={(e) => setReportTime(e.target.value)}
          className="rounded-md border border-[0.5px] border-border bg-navy px-2 py-1 text-xs text-warm"
        >
          <option>6:00 AM</option>
          <option>7:00 AM</option>
          <option>8:00 AM</option>
          <option>9:00 AM</option>
          <option>10:00 AM</option>
        </select>
        <span className="text-xs text-muted">to all participants</span>
        <button
          onClick={() => setReportOpen((v) => !v)}
          className="ml-auto rounded-md border border-[0.5px] border-border px-3 py-1 text-xs text-warm hover:bg-navy"
        >
          {reportOpen ? "Hide preview" : "Preview weekly report"}
        </button>
      </div>

      {reportOpen && (
        <WeeklyReport
          phases={phases}
          day={reportDay}
          time={reportTime}
          pct={stats.pct}
          onSend={() => toast("Report sent: Apex Property Services Weekly Report")}
        />
      )}

      {/* Controls */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex overflow-hidden rounded-lg border border-[0.5px] border-border">
          {(["all", "week", "flags", "high"] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-1.5 text-xs ${
                view === v ? "bg-navy-100 font-semibold text-warm" : "text-muted"
              }`}
            >
              {v === "all"
                ? "All tasks"
                : v === "week"
                  ? "This week"
                  : v === "flags"
                    ? "Flagged"
                    : "High priority"}
            </button>
          ))}
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as Role | "all")}
          className="rounded-lg border border-[0.5px] border-border bg-navy px-3 py-1.5 text-xs text-warm"
        >
          <option value="all">All roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <select
          value={phaseFilter}
          onChange={(e) => setPhaseFilter(e.target.value)}
          className="rounded-lg border border-[0.5px] border-border bg-navy px-3 py-1.5 text-xs text-warm"
        >
          <option value="all">All phases</option>
          {phases.map((p) => (
            <option key={p.name} value={p.name}>
              {p.name}
            </option>
          ))}
        </select>
        <span className="rounded-lg border border-teal-bd bg-teal-bg px-3 py-1 text-xs font-medium text-teal">
          Week of Apr 14
        </span>
      </div>

      {/* Task list */}
      {phases.map((phase, pi) => {
        if (phaseFilter !== "all" && phase.name !== phaseFilter) return null;
        const filtered = phase.tasks
          .map((t, ti) => ({ t, ti }))
          .filter(({ t }) => taskVisible(t));
        if (filtered.length === 0) return null;
        return (
          <PhaseSection
            key={phase.name}
            phase={phase}
            pi={pi}
            filtered={filtered}
            selected={selected}
            onSelect={setSelected}
            onUpdate={updateTask}
            onAdd={addTask}
          />
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "teal" | "blue" | "danger";
}) {
  const toneClass =
    tone === "teal"
      ? "text-teal"
      : tone === "blue"
        ? "text-[#85B7EB]"
        : tone === "danger"
          ? "text-danger"
          : "text-warm";
  return (
    <div className="rounded-lg bg-navy-100 px-4 py-3">
      <div className="text-[11px] text-muted">{label}</div>
      <div className={`text-xl font-semibold ${toneClass}`}>{value}</div>
    </div>
  );
}

function PhaseSection({
  phase,
  pi,
  filtered,
  selected,
  onSelect,
  onUpdate,
  onAdd,
}: {
  phase: Phase;
  pi: number;
  filtered: { t: Task; ti: number }[];
  selected: { pi: number; ti: number } | null;
  onSelect: (sel: { pi: number; ti: number } | null) => void;
  onUpdate: (pi: number, ti: number, patch: Partial<Task>) => void;
  onAdd: (pi: number, task: Partial<Task> & { task: string }) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<Role>("Buyer");
  const [newPri, setNewPri] = useState<Priority>("medium");

  return (
    <div className="mb-5">
      <div className="mb-1 flex items-center justify-between border-b border-[0.5px] border-border py-1.5">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted">
          {phase.name}
        </span>
        <button
          onClick={() => setAdding((v) => !v)}
          className="flex items-center gap-1 rounded-md border border-[0.5px] border-border px-2 py-0.5 text-[11px] text-muted hover:bg-navy-100"
        >
          <Plus className="h-3 w-3" />
          Add task
        </button>
      </div>
      {filtered.map(({ t, ti }) => {
        const isSelected = selected?.pi === pi && selected?.ti === ti;
        return (
          <div key={ti}>
            <TaskRow
              t={t}
              over={isOverdue(t)}
              week={isThisWeek(t)}
              selected={isSelected}
              onClick={() => onSelect(isSelected ? null : { pi, ti })}
            />
            {isSelected && (
              <TaskDetail
                t={t}
                phaseName={phase.name}
                onUpdate={(patch) => onUpdate(pi, ti, patch)}
              />
            )}
          </div>
        );
      })}
      {adding && (
        <div className="mt-2 grid grid-cols-1 gap-2 rounded-lg border border-[0.5px] border-border bg-navy-100 p-3 md:grid-cols-[1fr_120px_100px_auto_auto]">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Task name..."
            className="rounded-md border border-[0.5px] border-border bg-navy px-2 py-1 text-sm text-warm outline-none focus:border-teal"
          />
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as Role)}
            className="rounded-md border border-[0.5px] border-border bg-navy px-2 py-1 text-xs text-warm"
          >
            {ROLES.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
          <select
            value={newPri}
            onChange={(e) => setNewPri(e.target.value as Priority)}
            className="rounded-md border border-[0.5px] border-border bg-navy px-2 py-1 text-xs text-warm"
          >
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <button
            onClick={() => {
              if (!newName.trim()) return;
              onAdd(pi, { task: newName.trim(), role: newRole, priority: newPri });
              setNewName("");
              setAdding(false);
            }}
            className="rounded-md border border-teal-bd bg-teal-bg px-3 py-1 text-xs font-semibold text-teal"
          >
            Add
          </button>
          <button
            onClick={() => setAdding(false)}
            className="rounded-md border border-[0.5px] border-border px-3 py-1 text-xs text-muted"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

function TaskRow({
  t,
  over,
  week,
  selected,
  onClick,
}: {
  t: Task;
  over: boolean;
  week: boolean;
  selected: boolean;
  onClick: () => void;
}) {
  const priColor =
    t.priority === "high" ? "#E24B4A" : t.priority === "medium" ? "#E8A020" : "#5F5E5A";
  const progColor = t.prog >= 100 ? "bg-teal" : t.prog > 0 ? "bg-amber" : "bg-[#2A4A7A]";
  const flagWarn = t.flagged && !t.flagNote;

  return (
    <div
      onClick={onClick}
      className={`grid cursor-pointer grid-cols-[10px_16px_1fr_96px_80px_54px] items-center gap-2 rounded-lg px-2 py-2 transition-colors hover:bg-navy-100 ${
        week ? "border-l-[3px] border-teal rounded-none pl-[5px]" : ""
      } ${selected ? "bg-navy-100" : ""}`}
    >
      <div
        className="h-2 w-2 rounded-full"
        style={{ background: priColor }}
      />
      <div
        title={flagWarn ? "Flag needs a note" : t.flagged ? "Issue flagged" : ""}
        className="relative"
      >
        <Flag
          className="h-3 w-3"
          style={{
            color: t.flagged ? "#E24B4A" : "var(--muted)",
            opacity: t.flagged ? 1 : 0.2,
          }}
        />
        {flagWarn && (
          <span className="absolute -right-1 -top-1 block h-1.5 w-1.5 rounded-full bg-danger" />
        )}
      </div>
      <div className="flex min-w-0 items-center gap-2 overflow-hidden">
        <span
          className={`truncate text-sm ${
            t.prog >= 100 ? "text-muted line-through" : "text-warm"
          }`}
        >
          {t.task}
        </span>
        {t.notes && (
          <span className="h-1 w-1 flex-shrink-0 rounded-full bg-[#185FA5]" />
        )}
        {t.custom && <span className="text-[10px] text-muted">custom</span>}
      </div>
      <RolePill role={t.role} />
      <div>
        <div className="h-1 overflow-hidden rounded-full bg-navy">
          <div
            className={`h-full transition-all ${progColor}`}
            style={{ width: `${t.prog}%` }}
          />
        </div>
        <div className="mt-0.5 text-[10px] text-muted">{t.prog}%</div>
      </div>
      <div
        className={`text-right text-[11px] ${
          over ? "font-medium text-danger" : "text-muted"
        }`}
      >
        {fmtDate(t.end)}
      </div>
    </div>
  );
}

const ROLE_PILL: Record<Role, string> = {
  Buyer: "bg-[#E6F1FB] text-[#0C447C]",
  "Deal Team": "bg-[#EEEDFE] text-[#3C3489]",
  "Ops Team": "bg-[#E1F5EE] text-[#085041]",
  Advisor: "bg-[#FAEEDA] text-[#633806]",
  Lawyer: "bg-[#FAECE7] text-[#712B13]",
};

function RolePill({ role }: { role: Role }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-center text-[11px] ${ROLE_PILL[role]}`}
    >
      {role}
    </span>
  );
}

function TaskDetail({
  t,
  phaseName,
  onUpdate,
}: {
  t: Task;
  phaseName: string;
  onUpdate: (patch: Partial<Task>) => void;
}) {
  return (
    <div className="mt-1 rounded-xl border border-[0.5px] border-border bg-navy p-5">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-base font-semibold text-warm">{t.task}</div>
          <div className="text-[11px] text-muted">
            {phaseName} · Owner: {t.role}
            {isOverdue(t) && <span className="ml-2 text-danger">Overdue</span>}
          </div>
        </div>
        <button
          onClick={() => onUpdate({ flagged: !t.flagged, flagNote: t.flagged ? "" : t.flagNote })}
          className={`flex items-center gap-1 rounded-md border border-[0.5px] px-3 py-1 text-xs ${
            t.flagged
              ? "border-danger bg-danger/10 text-danger"
              : "border-border text-muted hover:bg-navy-100"
          }`}
        >
          <Flag className="h-3 w-3" />
          {t.flagged ? "Flagged" : "Flag as issue"}
        </button>
      </div>

      <div className="mb-3 grid gap-3 md:grid-cols-2">
        <Field label="Progress">
          <div className="flex flex-wrap gap-1">
            {[0, 50, 100].map((p) => (
              <button
                key={p}
                onClick={() => onUpdate({ prog: p as 0 | 50 | 100 })}
                className={`rounded-md border border-[0.5px] px-3 py-1 text-xs ${
                  t.prog === p
                    ? p === 100
                      ? "border-teal bg-teal-bg text-teal"
                      : p === 50
                        ? "border-amber bg-amber/10 text-amber"
                        : "border-border bg-navy-100 text-warm"
                    : "border-border text-muted"
                }`}
              >
                {p === 0 ? "Not started" : p === 50 ? "50% done" : "Complete"}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Priority">
          <div className="flex flex-wrap gap-1">
            {(["high", "medium", "low"] as Priority[]).map((p) => (
              <button
                key={p}
                onClick={() => onUpdate({ priority: p })}
                className={`rounded-md border border-[0.5px] px-3 py-1 text-xs capitalize ${
                  t.priority === p
                    ? p === "high"
                      ? "border-danger bg-danger/10 text-danger"
                      : p === "medium"
                        ? "border-amber bg-amber/10 text-amber"
                        : "border-border bg-navy-100 text-muted"
                    : "border-border text-muted"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Owner">
          <select
            value={t.role}
            onChange={(e) => onUpdate({ role: e.target.value as Role })}
            className="rounded-md border border-[0.5px] border-border bg-navy-100 px-2 py-1 text-xs text-warm"
          >
            {ROLES.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </Field>
        <Field label="Due date">
          <input
            type="date"
            value={t.end.toISOString().split("T")[0]}
            onChange={(e) => onUpdate({ end: new Date(e.target.value + "T12:00:00") })}
            className="rounded-md border border-[0.5px] border-border bg-navy-100 px-2 py-1 text-xs text-warm"
          />
        </Field>
      </div>

      <Field label="Notes">
        <textarea
          value={t.notes}
          onChange={(e) => onUpdate({ notes: e.target.value })}
          placeholder="Add notes, context, or updates..."
          className="min-h-[60px] w-full rounded-md border border-[0.5px] border-border bg-navy-100 p-2 text-sm text-warm outline-none focus:border-teal"
        />
      </Field>

      {t.flagged && (
        <div className="mt-3 rounded-lg border border-[0.5px] border-danger/20 bg-danger/[0.07] p-3">
          <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-danger">
            <Flag className="h-3 w-3" />
            Issue / red flag details
            {!t.flagNote && (
              <span className="ml-auto text-[11px] font-normal">Note required</span>
            )}
          </div>
          <textarea
            value={t.flagNote}
            onChange={(e) => onUpdate({ flagNote: e.target.value })}
            placeholder="Describe the issue — this will appear in the weekly report..."
            className={`min-h-[52px] w-full rounded-md border p-2 text-sm text-warm outline-none ${
              t.flagNote
                ? "border-danger/30 bg-danger/[0.04]"
                : "border-[1.5px] border-danger bg-danger/[0.04]"
            }`}
          />
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] text-muted">{label}</span>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------

function WeeklyReport({
  phases,
  day,
  time,
  pct,
  onSend,
}: {
  phases: Phase[];
  day: string;
  time: string;
  pct: number;
  onSend: () => void;
}) {
  const flagged: { t: Task; phase: string }[] = [];
  const overdue: { t: Task; phase: string }[] = [];
  const completed: { t: Task; phase: string }[] = [];
  let missingNotes = 0;

  for (const ph of phases) {
    for (const t of ph.tasks) {
      if (t.prog === 100) completed.push({ t, phase: ph.name });
      if (t.flagged && t.flagNote) flagged.push({ t, phase: ph.name });
      if (t.flagged && !t.flagNote) missingNotes++;
      if (isOverdue(t)) overdue.push({ t, phase: ph.name });
    }
  }

  return (
    <div className="mb-4 overflow-hidden rounded-xl border border-[0.5px] border-border bg-navy-100">
      <div className="border-b border-[0.5px] border-border p-5">
        <div className="text-xs text-muted">Subject</div>
        <div className="mt-1 inline-block rounded-md bg-navy px-3 py-1 text-sm font-semibold text-warm">
          Apex Property Services Diligence Weekly Report
        </div>
        <div className="mt-2 text-xs text-muted">
          Sends every {day} at {time} · To: Buyer, Deal Team, Ops Team, Advisor, Lawyer
        </div>
        {missingNotes > 0 && (
          <div className="mt-2 rounded-md bg-danger/10 px-3 py-1.5 text-xs text-danger">
            {missingNotes} flag{missingNotes > 1 ? "s" : ""} missing a note — add a note to
            include in report
          </div>
        )}
        <div className="mt-3 flex items-center gap-2">
          <div className="text-xs text-muted">
            Overall progress:{" "}
            <strong className="text-warm">{pct}% complete</strong>
          </div>
          <button
            onClick={onSend}
            className="ml-auto rounded-md border border-[0.5px] border-border px-3 py-1 text-xs text-warm hover:bg-navy"
          >
            Send now
          </button>
        </div>
      </div>
      <div className="p-5">
        <ReportSection
          title={`Active issues (${flagged.length})`}
          tone="danger"
          items={flagged}
          showFlagNote
        />
        <ReportSection
          title={`Overdue tasks (${overdue.length})`}
          tone="amber"
          items={overdue}
          subBuilder={(t) => `Owner: ${t.role} · Was due ${fmtDate(t.end)}`}
        />
        <ReportSection
          title={`Completed (${completed.length})`}
          tone="teal"
          items={completed}
        />
        {flagged.length === 0 && overdue.length === 0 && completed.length === 0 && (
          <div className="py-4 text-center text-sm text-muted">
            No completed, flagged, or overdue tasks to report.
          </div>
        )}
      </div>
    </div>
  );
}

function ReportSection({
  title,
  tone,
  items,
  showFlagNote,
  subBuilder,
}: {
  title: string;
  tone: "danger" | "amber" | "teal";
  items: { t: Task; phase: string }[];
  showFlagNote?: boolean;
  subBuilder?: (t: Task) => string;
}) {
  if (items.length === 0) return null;
  const toneClass =
    tone === "danger" ? "text-danger" : tone === "amber" ? "text-amber" : "text-teal";
  const dotClass =
    tone === "danger" ? "bg-danger" : tone === "amber" ? "bg-amber" : "bg-teal";
  return (
    <div className="mb-5">
      <div
        className={`mb-2 border-b border-[0.5px] border-border pb-1 text-[11px] font-semibold uppercase tracking-wider ${toneClass}`}
      >
        {title}
      </div>
      {items.map(({ t, phase }, i) => (
        <div
          key={i}
          className="flex items-start gap-2 border-b border-[0.5px] border-border py-2 last:border-b-0"
        >
          <div className={`mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full ${dotClass}`} />
          <div>
            <div className="text-sm font-medium text-warm">{t.task}</div>
            <div className="text-xs text-muted">
              {subBuilder ? subBuilder(t) : `Owner: ${t.role} · Phase: ${phase}`}
            </div>
            {showFlagNote && t.flagNote && (
              <div className="mt-1 rounded-md bg-danger/[0.07] p-2 text-xs text-danger">
                {t.flagNote}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
