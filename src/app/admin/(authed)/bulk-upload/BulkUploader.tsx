"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import {
  CAPABILITIES,
  DATASET_DOMAINS,
  ORGANIZATION_TYPES,
  SECTORS,
} from "@/lib/constants";
import type { Organization } from "@/lib/types";
import {
  commitBulkUploadAction,
  type BulkRow,
  type CommitResult,
} from "./_actions";

const VALID_SECTORS = new Set(SECTORS.map((s) => s.value));
const VALID_TYPES = new Set(ORGANIZATION_TYPES.map((t) => t.value));
const VALID_STATUSES = new Set(["active", "in_contact", "deprioritized"]);
const VALID_CAPS = new Set(CAPABILITIES);
const VALID_DOMAINS = new Set(DATASET_DOMAINS);

interface RawCsvRow {
  [key: string]: string;
}

interface ParsedRow {
  raw: RawCsvRow;
  row: BulkRow | null;
  errors: string[];
  match: { kind: "insert" } | { kind: "update"; existingId: string } | { kind: "conflict"; reason: string };
}

function tryArray(s: string): string[] {
  if (!s) return [];
  s = s.trim();
  if (!s) return [];
  if (s.startsWith("[")) {
    try {
      const a = JSON.parse(s);
      return Array.isArray(a) ? a.map(String) : [];
    } catch {
      // fallthrough
    }
  }
  return s.split(/[,;|]/).map((x) => x.trim()).filter(Boolean);
}

function parseRow(raw: RawCsvRow, existing: Organization[]): ParsedRow {
  const errors: string[] = [];
  const id = (raw.id ?? "").trim() || undefined;
  const name = (raw.name ?? "").trim();
  if (!name) errors.push("missing name");

  const sectors = tryArray(raw.sectors ?? raw.sector ?? "").filter((s) =>
    VALID_SECTORS.has(s as never),
  );
  if (sectors.length === 0) {
    errors.push(`no valid sectors in "${raw.sectors ?? raw.sector ?? ""}"`);
  }

  const organization_type = (raw.organization_type ?? "nonprofit").trim() || "nonprofit";
  if (!VALID_TYPES.has(organization_type as never)) {
    errors.push(`invalid organization_type "${organization_type}"`);
  }

  const engagement_status = (raw.engagement_status ?? "active").trim() || "active";
  if (!VALID_STATUSES.has(engagement_status)) {
    errors.push(`invalid engagement_status "${engagement_status}"`);
  }

  const capabilities = tryArray(raw.capabilities ?? "").filter((c) => VALID_CAPS.has(c as never));
  const dataset_domains = tryArray(raw.dataset_domains ?? "").filter((d) =>
    VALID_DOMAINS.has(d as never),
  );

  const row: BulkRow = {
    id,
    name,
    url: (raw.url ?? "").trim(),
    description: (raw.description ?? "").trim(),
    sectors,
    organization_type,
    engagement_status,
    capabilities,
    dataset_domains,
    partners: tryArray(raw.partners ?? ""),
    datasets_of_focus: tryArray(raw.datasets_of_focus ?? ""),
    contact_name: (raw.contact_name ?? "").trim() || null,
    contact_email: (raw.contact_email ?? "").trim() || null,
    is_verified: String(raw.is_verified ?? "").toLowerCase() === "true",
  };

  let match: ParsedRow["match"];
  if (id) {
    const byId = existing.find((o) => o.id === id);
    match = byId ? { kind: "update", existingId: byId.id } : { kind: "insert" };
  } else if (name) {
    const byName = existing.filter((o) => o.name.toLowerCase() === name.toLowerCase());
    if (byName.length === 1) {
      match = { kind: "update", existingId: byName[0].id };
    } else if (byName.length > 1) {
      match = {
        kind: "conflict",
        reason: `name matches ${byName.length} existing rows — provide id`,
      };
    } else {
      match = { kind: "insert" };
    }
  } else {
    match = { kind: "conflict", reason: "no id or name" };
  }

  return { raw, row: errors.length === 0 ? row : null, errors, match };
}

export function BulkUploader({ existing }: { existing: Organization[] }) {
  const router = useRouter();
  const [parsed, setParsed] = useState<ParsedRow[] | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [committing, startCommit] = useTransition();
  const [result, setResult] = useState<CommitResult | null>(null);

  function onFile(file: File) {
    setParseError(null);
    setResult(null);
    Papa.parse<RawCsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      complete: (res) => {
        if (res.errors.length) {
          setParseError(res.errors.map((e) => e.message).join("; "));
        }
        const rows = res.data.map((r) => parseRow(r, existing));
        setParsed(rows);
      },
      error: (err) => setParseError(err.message),
    });
  }

  const summary = parsed
    ? {
        inserts: parsed.filter((r) => r.match.kind === "insert" && !r.errors.length).length,
        updates: parsed.filter((r) => r.match.kind === "update" && !r.errors.length).length,
        conflicts: parsed.filter((r) => r.match.kind === "conflict").length,
        invalid: parsed.filter((r) => r.errors.length > 0).length,
      }
    : null;

  function commit() {
    if (!parsed) return;
    setResult(null);
    const inserts = parsed
      .filter((r) => r.row && r.match.kind === "insert")
      .map((r) => r.row!);
    const updates = parsed
      .filter((r) => r.row && r.match.kind === "update")
      .map((r) => ({ id: (r.match as { kind: "update"; existingId: string }).existingId, row: r.row! }));

    startCommit(async () => {
      const r = await commitBulkUploadAction(inserts, updates);
      setResult(r);
      if (r.ok) router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-dashed border-nyce-line bg-white p-8">
        <label className="cursor-pointer block">
          <span className="text-[11px] uppercase tracking-[0.18em] text-nyce-muted font-semibold">
            CSV file
          </span>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
            }}
            className="mt-3 block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-nyce-accentSoft file:text-nyce-accent file:font-semibold hover:file:bg-nyce-accent hover:file:text-white file:transition-colors"
          />
          <span className="block mt-3 text-xs text-nyce-muted">
            Schema: matches the export CSV. Multi-value fields can be JSON arrays or
            comma-separated. Headers required.
          </span>
        </label>

        {parseError && (
          <p className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {parseError}
          </p>
        )}
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-nyce-line border border-nyce-line rounded-xl overflow-hidden">
          <Stat label="Adds" value={summary.inserts} accent />
          <Stat label="Updates" value={summary.updates} accent />
          <Stat label="Conflicts" value={summary.conflicts} warn={summary.conflicts > 0} />
          <Stat label="Invalid" value={summary.invalid} warn={summary.invalid > 0} />
        </div>
      )}

      {parsed && parsed.length > 0 && (
        <div className="rounded-2xl border border-nyce-line bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-nyce-paper">
                <tr>
                  <th className="text-left px-3 py-2 text-[10px] uppercase tracking-wider text-nyce-muted">
                    Action
                  </th>
                  <th className="text-left px-3 py-2 text-[10px] uppercase tracking-wider text-nyce-muted">
                    Name
                  </th>
                  <th className="text-left px-3 py-2 text-[10px] uppercase tracking-wider text-nyce-muted">
                    Sector
                  </th>
                  <th className="text-left px-3 py-2 text-[10px] uppercase tracking-wider text-nyce-muted">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody>
                {parsed.map((r, i) => (
                  <tr key={i} className="border-t border-nyce-line/60">
                    <td className="px-3 py-2">
                      <ActionTag parsed={r} />
                    </td>
                    <td className="px-3 py-2 text-nyce-ink">{r.raw.name || "—"}</td>
                    <td className="px-3 py-2 text-nyce-muted">{r.raw.sectors || r.raw.sector || "—"}</td>
                    <td className="px-3 py-2 text-nyce-muted">
                      {r.errors.length > 0 ? (
                        <span className="text-red-700">{r.errors.join("; ")}</span>
                      ) : r.match.kind === "conflict" ? (
                        <span className="text-amber-700">{r.match.reason}</span>
                      ) : r.match.kind === "update" ? (
                        <span>matches id {r.match.existingId}</span>
                      ) : (
                        <span>new record</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {summary && summary.inserts + summary.updates > 0 && (
        <div className="flex items-center gap-3">
          <button
            onClick={commit}
            disabled={committing}
            className="rounded-full bg-nyce-accent text-white px-6 py-3 text-sm font-semibold hover:bg-nyce-accentDark disabled:opacity-60"
          >
            {committing
              ? "Committing…"
              : `Commit ${summary.inserts} adds, ${summary.updates} updates`}
          </button>
          <button
            onClick={() => {
              setParsed(null);
              setResult(null);
            }}
            className="text-sm text-nyce-muted hover:text-nyce-ink underline underline-offset-2"
          >
            Cancel
          </button>
        </div>
      )}

      {result && (
        <div
          className={`rounded-2xl border p-4 ${
            result.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-red-200 bg-red-50 text-red-900"
          }`}
        >
          <p className="font-semibold mb-1">
            {result.ok ? "Commit succeeded." : "Commit completed with errors."}
          </p>
          <p className="text-sm">
            Inserted {result.inserted}, updated {result.updated}.
          </p>
          {result.errors.length > 0 && (
            <ul className="mt-2 text-xs list-disc pl-5 space-y-0.5">
              {result.errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
  warn,
}: {
  label: string;
  value: number;
  accent?: boolean;
  warn?: boolean;
}) {
  return (
    <div className="bg-white px-5 py-4">
      <div
        className={`font-display font-bold text-3xl tabular-nums leading-none ${
          warn ? "text-amber-700" : accent ? "text-nyce-accent" : "text-nyce-ink"
        }`}
      >
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-wider text-nyce-muted mt-1">{label}</div>
    </div>
  );
}

function ActionTag({ parsed }: { parsed: ParsedRow }) {
  if (parsed.errors.length > 0) {
    return (
      <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-semibold">
        invalid
      </span>
    );
  }
  if (parsed.match.kind === "conflict") {
    return (
      <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold">
        conflict
      </span>
    );
  }
  if (parsed.match.kind === "update") {
    return (
      <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-nyce-aquaSoft text-[#2A5E68] font-semibold">
        update
      </span>
    );
  }
  return (
    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-nyce-accentSoft text-nyce-accent font-semibold">
      add
    </span>
  );
}
