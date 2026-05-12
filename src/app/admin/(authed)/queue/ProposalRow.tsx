"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  approveProposalAction,
  rejectProposalAction,
} from "@/app/directory/_actions";

interface ProposalRecord {
  id: string;
  target_org_id: string | null;
  proposed_payload: Record<string, unknown>;
  proposer_email: string;
  rationale: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

interface OrgRecord {
  id: string;
  name: string;
  url: string | null;
  description: string | null;
  sectors: string[];
  organization_type: string;
  capabilities: string[];
  dataset_domains: string[];
  contact_name: string | null;
  contact_email: string | null;
}

export function ProposalRow({
  proposal,
  currentOrg,
}: {
  proposal: ProposalRecord;
  currentOrg: OrgRecord | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const isEdit = Boolean(proposal.target_org_id);
  const payload = proposal.proposed_payload;

  const diff = currentOrg ? buildDiff(currentOrg, payload) : null;

  function approve() {
    setError(null);
    startTransition(async () => {
      const r = await approveProposalAction(proposal.id, adminNote || undefined);
      if (!r.ok) setError(r.error ?? "Failed.");
      else router.refresh();
    });
  }

  function reject() {
    setError(null);
    if (!adminNote.trim()) {
      setError("A reason is required when rejecting.");
      return;
    }
    startTransition(async () => {
      const r = await rejectProposalAction(proposal.id, adminNote);
      if (!r.ok) setError(r.error ?? "Failed.");
      else router.refresh();
    });
  }

  return (
    <article className="rounded-2xl border border-nyce-line bg-white overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full p-5 flex items-start justify-between gap-4 hover:bg-nyce-paper transition-colors text-left"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span
              className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-semibold ${
                isEdit
                  ? "bg-nyce-aquaSoft text-[#2A5E68]"
                  : "bg-nyce-yellowSoft text-[#7C5F00]"
              }`}
            >
              {isEdit ? "Edit" : "New org"}
            </span>
            <span className="font-display font-semibold text-lg text-nyce-ink truncate">
              {String(payload.name ?? "—")}
            </span>
            {isEdit && currentOrg && (
              <Link
                href={`/directory/${currentOrg.id}`}
                onClick={(e) => e.stopPropagation()}
                className="text-xs text-nyce-muted hover:text-nyce-accent underline underline-offset-2"
              >
                view current →
              </Link>
            )}
          </div>
          <p className="text-xs text-nyce-muted">
            From <span className="font-mono">{proposal.proposer_email}</span> ·{" "}
            {new Date(proposal.created_at).toLocaleDateString()}
            {proposal.rationale && (
              <span className="ml-2 text-nyce-slate">— "{proposal.rationale}"</span>
            )}
          </p>
        </div>
        <span className="text-nyce-muted text-xs flex-shrink-0">
          {open ? "Collapse" : "Review"} {open ? "▴" : "▾"}
        </span>
      </button>

      {open && (
        <div className="border-t border-nyce-line p-5 space-y-5">
          {isEdit && diff ? (
            <DiffView diff={diff} />
          ) : (
            <PayloadView payload={payload} />
          )}

          {proposal.status === "pending" && (
            <div className="border-t border-nyce-line pt-5 space-y-3">
              <label className="block">
                <span className="text-[10px] uppercase tracking-[0.18em] text-nyce-muted font-semibold">
                  Admin note (required to reject; optional to approve)
                </span>
                <textarea
                  rows={2}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="mt-1.5 w-full rounded-md border border-nyce-line bg-white px-3 py-2 text-sm focus:outline-none focus:border-nyce-accent focus:ring-2 focus:ring-nyce-accent/20"
                  placeholder="e.g. Approved with edits to capabilities; rejected because already covered by id 26."
                />
              </label>

              {error && (
                <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  {error}
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={approve}
                  disabled={pending}
                  className="rounded-full bg-nyce-accent text-white px-5 py-2 text-sm font-semibold hover:bg-nyce-accentDark disabled:opacity-60"
                >
                  {pending ? "Working…" : "Approve & apply"}
                </button>
                <button
                  onClick={reject}
                  disabled={pending}
                  className="rounded-full border border-nyce-line bg-white px-5 py-2 text-sm font-semibold hover:border-red-300 hover:text-red-700 disabled:opacity-60"
                >
                  Reject
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

interface DiffEntry {
  field: string;
  before: string;
  after: string;
}

function buildDiff(current: OrgRecord, proposed: Record<string, unknown>): DiffEntry[] {
  const fields: { key: keyof OrgRecord; label: string }[] = [
    { key: "name", label: "Name" },
    { key: "url", label: "URL" },
    { key: "description", label: "Description" },
    { key: "sectors", label: "Sectors" },
    { key: "organization_type", label: "Type" },
    { key: "capabilities", label: "Capabilities" },
    { key: "dataset_domains", label: "Dataset domains" },
    { key: "contact_name", label: "Contact name" },
    { key: "contact_email", label: "Contact email" },
  ];
  const fmt = (v: unknown): string =>
    v == null
      ? "—"
      : Array.isArray(v)
      ? v.length
        ? v.join(", ")
        : "—"
      : String(v);

  const out: DiffEntry[] = [];
  for (const { key, label } of fields) {
    const before = fmt((current as unknown as Record<string, unknown>)[key]);
    const after = fmt(proposed[key]);
    if (before !== after) out.push({ field: label, before, after });
  }
  return out;
}

function DiffView({ diff }: { diff: DiffEntry[] }) {
  if (diff.length === 0) {
    return (
      <p className="text-sm text-nyce-muted italic">
        Proposed payload matches the current record — nothing to change.
      </p>
    );
  }
  return (
    <div className="space-y-3">
      <p className="text-[10px] uppercase tracking-[0.18em] text-nyce-muted font-semibold">
        {diff.length} change{diff.length === 1 ? "" : "s"}
      </p>
      <div className="space-y-2">
        {diff.map((d) => (
          <div key={d.field} className="grid md:grid-cols-[140px_1fr_1fr] gap-3 items-start">
            <div className="text-xs font-semibold text-nyce-slate">{d.field}</div>
            <div className="text-xs px-3 py-2 rounded-md bg-red-50 border border-red-100 text-red-900 line-through">
              {d.before}
            </div>
            <div className="text-xs px-3 py-2 rounded-md bg-emerald-50 border border-emerald-100 text-emerald-900">
              {d.after}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PayloadView({ payload }: { payload: Record<string, unknown> }) {
  const rows: { label: string; value: string }[] = [
    { label: "Name", value: String(payload.name ?? "—") },
    { label: "URL", value: String(payload.url ?? "—") },
    { label: "Description", value: String(payload.description ?? "—") },
    {
      label: "Sectors",
      value: Array.isArray(payload.sectors)
        ? (payload.sectors as string[]).join(", ") || "—"
        : (payload.sector as string) || "—",
    },
    { label: "Type", value: String(payload.organization_type ?? "—") },
    {
      label: "Capabilities",
      value: Array.isArray(payload.capabilities)
        ? (payload.capabilities as string[]).join(", ") || "—"
        : "—",
    },
    {
      label: "Domains",
      value: Array.isArray(payload.dataset_domains)
        ? (payload.dataset_domains as string[]).join(", ") || "—"
        : "—",
    },
    { label: "Contact name", value: String(payload.contact_name ?? "—") },
    { label: "Contact email", value: String(payload.contact_email ?? "—") },
  ];
  return (
    <dl className="grid md:grid-cols-[160px_1fr] gap-y-2 gap-x-4 text-sm">
      {rows.map((r) => (
        <div key={r.label} className="contents">
          <dt className="text-xs font-semibold text-nyce-slate uppercase tracking-wider">
            {r.label}
          </dt>
          <dd className="text-nyce-ink break-words">{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}
