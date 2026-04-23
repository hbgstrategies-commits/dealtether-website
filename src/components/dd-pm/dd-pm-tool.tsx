"use client";

import { useMemo, useState } from "react";
import { Flag, X } from "lucide-react";
import {
  INITIAL_PARTICIPANTS,
  PM_ROLES,
  PM_ROLE_AVATAR,
  PM_ROLE_PILL,
  type PmParticipant,
  type PmPhase,
  type PmPriority,
  type PmRole,
  type PmTask,
  buildInitialPhases,
  fmtDate,
  isOverdue,
  isThisWeek,
} from "./dd-pm-data";

/**
 * Property Management Deal Workspace — React port of legacy/dd-pm.html.
 *
 * Expanded version of the generic Deal Workspace: PM-specific task list,
 * 8 roles, participants bar with magic-link invite modal, transition
 * months for post-close.
 */

type View = "all" | "week" | "flags" | "high";

export function DdPmTool() {
  const [phases, setPhases] = useState<PmPhase[]>(() => buildInitialPhases());
  const [participants, setParticipants] = useState<PmParticipant[]>(INITIAL_PARTICIPANTS);
  const [view, setView] = useState<View>("week");
  const [roleFilter, setRoleFilter] = useState<PmRole | "all">("all");
  const [phaseFilter, setPhaseFilter] = useState<string>("all");
  const [selected, setSelected] = useState<{ pi: number; ti: number } | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportDay, setReportDay] = useState("Thu");
  const [reportTime, setReportTime] = useState("8:00 AM");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const stats = useMemo(() => {
    let total = 0, done = 0, week = 0, overdue = 0, flags = 0;
    for (const p of phases) {
      for (const t of p.tasks) {
        total++;
        if (t.prog >= 100) done++;
        if (isThisWeek(t)) week++;
        if (isOverdue(t)) overdue++;
        if (t.flagged) flags++;
      }
    }
    return {
      total, done, week, overdue, flags,
      pct: total > 0 ? Math.round((done / total) * 100) : 0,
    };
  }, [phases]);

  function updateTask(pi: number, ti: number, patch: Partial<PmTask>) {
    setPhases((prev) =>
      prev.map((ph, i) =>
        i !== pi
          ? ph
          : { ...ph, tasks: ph.tasks.map((t, j) => (j !== ti ? t : { ...t, ...patch })) }
      )
    );
  }

  function toast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2400);
  }

  function inviteParticipant(p: PmParticipant) {
    setParticipants((prev) => [...prev, p]);
    toast(`Magic link sent to ${p.name}`);
  }

  function visible(t: PmTask) {
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

      {inviteOpen && (
        <InviteModal
          onClose={() => setInviteOpen(false)}
          onSubmit={(p) => {
            inviteParticipant(p);
            setInviteOpen(false);
          }}
          onError={(msg) => toast(msg)}
        />
      )}

      <DealHeader pct={stats.pct} />

      <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-5">
        <Stat label="Total tasks" value={stats.total} />
        <Stat label="Complete" value={stats.done} tone="teal" />
        <Stat label="This week" value={stats.week} tone="blue" />
        <Stat label="Overdue" value={stats.overdue} tone="danger" />
        <Stat label="Flags" value={stats.flags} tone="amber" />
      </div>

      <ParticipantsBar
        participants={participants}
        onInvite={() => setInviteOpen(true)}
      />

      <ReportScheduler
        day={reportDay}
        time={reportTime}
        open={reportOpen}
        onSetDay={setReportDay}
        onSetTime={setReportTime}
        onToggle={() => setReportOpen((v) => !v)}
      />

      {reportOpen && (
        <WeeklyReport
          phases={phases}
          day={reportDay}
          time={reportTime}
          pct={stats.pct}
          onSend={() => toast("Report sent to all participants")}
        />
      )}

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
              {v === "all" ? "All tasks" : v === "week" ? "This week" : v === "flags" ? "Flagged" : "High priority"}
            </button>
          ))}
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as PmRole | "all")}
          className="rounded-lg border border-[0.5px] border-border bg-navy px-3 py-1.5 text-xs text-warm"
        >
          <option value="all">All roles</option>
          {PM_ROLES.map((r) => (
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

      {phases.map((phase, pi) => {
        if (phaseFilter !== "all" && phase.name !== phaseFilter) return null;
        const filtered = phase.tasks
          .map((t, ti) => ({ t, ti }))
          .filter(({ t }) => visible(t));
        if (filtered.length === 0) return null;
        const done = phase.tasks.filter((t) => t.prog >= 100).length;
        return (
          <div key={phase.name} className="mb-5">
            <div className="mb-1 flex items-center justify-between border-b border-[0.5px] border-border py-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                {phase.name}
                <span
                  className={`ml-2 font-normal ${
                    done === phase.tasks.length ? "text-teal" : "text-muted"
                  }`}
                >
                  {done}/{phase.tasks.length}
                </span>
              </span>
            </div>
            {filtered.map(({ t, ti }) => {
              const isSelected = selected?.pi === pi && selected?.ti === ti;
              return (
                <div key={ti}>
                  <TaskRow
                    t={t}
                    selected={isSelected}
                    onClick={() =>
                      setSelected(isSelected ? null : { pi, ti })
                    }
                  />
                  {isSelected && (
                    <TaskDetail
                      t={t}
                      phaseName={phase.name}
                      onUpdate={(patch) => updateTask(pi, ti, patch)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------

function DealHeader({ pct }: { pct: number }) {
  return (
    <div className="mb-4 rounded-2xl border border-[0.5px] border-border bg-navy-100 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[11px] text-muted">
            Active deal · Property Management Acquisition
          </div>
          <div className="text-xl font-bold tracking-tether-tight text-warm">
            Apex Property Services
          </div>
        </div>
        <div className="rounded-lg bg-navy px-4 py-1.5 text-sm text-muted">
          <span className="font-semibold text-danger">18</span> days remaining in DD
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-6 text-xs">
        <div>
          <div className="text-muted">LOI signed</div>
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
        <div>
          <div className="text-muted">Units under management</div>
          <div className="font-medium text-warm">312 units</div>
        </div>
      </div>
      <div className="mt-4">
        <div className="mb-1 flex justify-between text-xs">
          <span className="text-muted">Overall deal progress</span>
          <span className="font-semibold text-warm">{pct}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-navy">
          <div
            className="h-full bg-teal transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "teal" | "blue" | "danger" | "amber";
}) {
  const color =
    tone === "teal"
      ? "text-teal"
      : tone === "blue"
        ? "text-[#85B7EB]"
        : tone === "danger"
          ? "text-danger"
          : tone === "amber"
            ? "text-amber"
            : "text-warm";
  return (
    <div className="rounded-lg bg-navy-100 px-3 py-3">
      <div className="text-[10px] text-muted">{label}</div>
      <div className={`text-xl font-semibold ${color}`}>{value}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function ParticipantsBar({
  participants,
  onInvite,
}: {
  participants: PmParticipant[];
  onInvite: () => void;
}) {
  return (
    <div className="mb-4 rounded-xl border border-[0.5px] border-border bg-navy-100 p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-warm">Deal participants</span>
        <span className="text-[11px] text-muted">
          Each person receives a magic link — no account needed · Weekly reports go
          to all participants
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {participants.map((p) => {
          const initials = p.name
            .split(" ")
            .map((w) => w[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();
          const avatar = PM_ROLE_AVATAR[p.role];
          return (
            <div
              key={p.email}
              className="flex items-center gap-2 rounded-lg border border-[0.5px] border-border bg-navy px-2.5 py-1.5"
            >
              <div
                className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold"
                style={{ background: avatar.bg, color: avatar.fg }}
              >
                {initials}
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-xs font-medium text-warm">{p.name}</span>
                <span className="text-[10px] text-muted">{p.role}</span>
              </div>
            </div>
          );
        })}
        <button
          onClick={onInvite}
          className="rounded-lg border border-dashed border-border bg-transparent px-3 py-1.5 text-xs text-muted hover:border-teal hover:text-teal"
        >
          + Invite participant
        </button>
      </div>
    </div>
  );
}

function InviteModal({
  onClose,
  onSubmit,
  onError,
}: {
  onClose: () => void;
  onSubmit: (p: PmParticipant) => void;
  onError: (msg: string) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<PmRole>("Buyer");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/95 p-4">
      <div className="w-full max-w-md rounded-2xl border border-[0.5px] border-border bg-navy-100 p-6">
        <div className="mb-2 flex items-start justify-between">
          <div className="text-base font-semibold text-warm">
            Invite a participant
          </div>
          <button onClick={onClose} className="text-muted hover:text-warm">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mb-5 text-sm leading-relaxed text-muted">
          They&apos;ll receive a magic link by email — no account needed. Assign their
          role so they&apos;re notified of their tasks and included in weekly reports.
        </p>
        <div className="mb-3">
          <label className="mb-1 block text-xs text-muted">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sarah Johnson"
            className="w-full rounded-lg border border-[0.5px] border-border bg-navy px-3 py-2 text-sm text-warm outline-none focus:border-teal"
          />
        </div>
        <div className="mb-3">
          <label className="mb-1 block text-xs text-muted">Email address</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="sarah@example.com"
            type="email"
            className="w-full rounded-lg border border-[0.5px] border-border bg-navy px-3 py-2 text-sm text-warm outline-none focus:border-teal"
          />
        </div>
        <div className="mb-5">
          <label className="mb-1 block text-xs text-muted">Role on this deal</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as PmRole)}
            className="w-full rounded-lg border border-[0.5px] border-border bg-navy px-3 py-2 text-sm text-warm outline-none focus:border-teal"
          >
            {PM_ROLES.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              if (!name.trim() || !email.trim()) {
                onError("Please enter name and email");
                return;
              }
              onSubmit({ name: name.trim(), email: email.trim(), role });
            }}
            className="flex-1 rounded-lg bg-teal py-2.5 text-sm font-semibold text-navy hover:bg-teal-dim"
          >
            Send magic link
          </button>
          <button
            onClick={onClose}
            className="rounded-lg border border-[0.5px] border-border px-4 py-2.5 text-sm text-muted hover:bg-navy"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function ReportScheduler({
  day,
  time,
  open,
  onSetDay,
  onSetTime,
  onToggle,
}: {
  day: string;
  time: string;
  open: boolean;
  onSetDay: (d: string) => void;
  onSetTime: (t: string) => void;
  onToggle: () => void;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-[0.5px] border-border bg-navy-100 px-4 py-3">
      <span className="text-sm text-muted">Weekly report sends every</span>
      <div className="flex gap-1">
        {["Mon", "Tue", "Wed", "Thu", "Fri"].map((d) => (
          <button
            key={d}
            onClick={() => onSetDay(d)}
            className={`rounded-md border border-[0.5px] px-2 py-1 text-xs ${
              day === d
                ? "border-teal-bd bg-teal-bg text-teal"
                : "border-border text-muted"
            }`}
          >
            {d}
          </button>
        ))}
      </div>
      <select
        value={time}
        onChange={(e) => onSetTime(e.target.value)}
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
        onClick={onToggle}
        className="ml-auto rounded-md border border-[0.5px] border-border px-3 py-1 text-xs text-warm hover:bg-navy"
      >
        {open ? "Hide preview" : "Preview weekly report"}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------

function TaskRow({
  t,
  selected,
  onClick,
}: {
  t: PmTask;
  selected: boolean;
  onClick: () => void;
}) {
  const priColor =
    t.priority === "high"
      ? "#E24B4A"
      : t.priority === "medium"
        ? "#E8A020"
        : "#5F5E5A";
  const progColor =
    t.prog >= 100 ? "bg-teal" : t.prog > 0 ? "bg-amber" : "bg-[#2A4A7A]";
  const flagWarn = t.flagged && !t.flagNote;
  const week = isThisWeek(t);
  const over = isOverdue(t);

  return (
    <div
      onClick={onClick}
      className={`grid cursor-pointer grid-cols-[10px_16px_1fr_110px_80px_58px] items-center gap-2 rounded-lg px-2 py-2 transition-colors hover:bg-navy-100 ${
        week ? "rounded-none border-l-[3px] border-teal pl-[5px]" : ""
      } ${selected ? "bg-navy-100" : ""} ${
        t.flagged ? "border border-danger/15 bg-danger/[0.05]" : ""
      }`}
    >
      <div className="h-2 w-2 rounded-full" style={{ background: priColor }} />
      <div className="relative">
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
      </div>
      <span
        className={`max-w-full truncate rounded-full px-2 py-0.5 text-[11px] ${PM_ROLE_PILL[t.role]}`}
      >
        {t.role}
      </span>
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

function TaskDetail({
  t,
  phaseName,
  onUpdate,
}: {
  t: PmTask;
  phaseName: string;
  onUpdate: (patch: Partial<PmTask>) => void;
}) {
  return (
    <div className="my-1 rounded-xl border border-[0.5px] border-border bg-navy p-5">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-base font-semibold text-warm">{t.task}</div>
          <div className="text-[11px] text-muted">
            {phaseName} · Owner: {t.role}
            {isOverdue(t) && <span className="ml-2 text-danger">Overdue</span>}
          </div>
        </div>
        <button
          onClick={() =>
            onUpdate({
              flagged: !t.flagged,
              flagNote: t.flagged ? "" : t.flagNote,
            })
          }
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
                {p === 0 ? "Not started" : p === 50 ? "50%" : "Complete"}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Priority">
          <div className="flex flex-wrap gap-1">
            {(["high", "medium", "low"] as PmPriority[]).map((p) => (
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
            onChange={(e) => onUpdate({ role: e.target.value as PmRole })}
            className="rounded-md border border-[0.5px] border-border bg-navy-100 px-2 py-1 text-xs text-warm"
          >
            {PM_ROLES.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </Field>
        <Field label="Due date">
          <input
            type="date"
            value={t.end.toISOString().split("T")[0]}
            onChange={(e) =>
              onUpdate({ end: new Date(e.target.value + "T12:00:00") })
            }
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
            className="min-h-[52px] w-full rounded-md border border-danger/40 bg-danger/[0.04] p-2 text-sm text-warm outline-none focus:border-danger"
          />
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
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
  phases: PmPhase[];
  day: string;
  time: string;
  pct: number;
  onSend: () => void;
}) {
  const flagged: { t: PmTask; phase: string }[] = [];
  const overdueList: { t: PmTask; phase: string }[] = [];
  const completed: { t: PmTask; phase: string }[] = [];
  let missingNotes = 0;

  for (const ph of phases) {
    for (const t of ph.tasks) {
      if (t.prog === 100) completed.push({ t, phase: ph.name });
      if (t.flagged && t.flagNote) flagged.push({ t, phase: ph.name });
      if (t.flagged && !t.flagNote) missingNotes++;
      if (isOverdue(t)) overdueList.push({ t, phase: ph.name });
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
          Sends every {day} at {time} · To all participants
        </div>
        {missingNotes > 0 && (
          <div className="mt-2 rounded-md bg-danger/10 px-3 py-1.5 text-xs text-danger">
            {missingNotes} flag{missingNotes > 1 ? "s" : ""} missing a note — add a
            note to include in report
          </div>
        )}
        <div className="mt-3 flex items-center gap-2">
          <div className="text-xs text-muted">
            Overall progress:{" "}
            <strong className="text-warm">{pct}% complete</strong>
          </div>
          <button
            onClick={onSend}
            className="ml-auto rounded-md border border-teal bg-teal-bg px-3 py-1 text-xs font-semibold text-teal"
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
          title={`Overdue tasks (${overdueList.length})`}
          tone="amber"
          items={overdueList}
          subBuilder={(t) =>
            `Owner: ${t.role} · Was due ${fmtDate(t.end)}`
          }
        />
        <ReportSection
          title={`Completed (${completed.length})`}
          tone="teal"
          items={completed}
        />
        {flagged.length === 0 &&
          overdueList.length === 0 &&
          completed.length === 0 && (
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
  items: { t: PmTask; phase: string }[];
  showFlagNote?: boolean;
  subBuilder?: (t: PmTask) => string;
}) {
  if (items.length === 0) return null;
  const toneClass =
    tone === "danger"
      ? "text-danger"
      : tone === "amber"
        ? "text-amber"
        : "text-teal";
  const dotClass =
    tone === "danger"
      ? "bg-danger"
      : tone === "amber"
        ? "bg-amber"
        : "bg-teal";
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
