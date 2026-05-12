"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Papa from "papaparse";
import Fuse from "fuse.js";
import type {
  Organization,
  Sector,
  OrganizationType,
  Capability,
  DatasetDomain,
} from "@/lib/types";
import {
  SECTORS,
  ORGANIZATION_TYPES,
  CAPABILITIES,
  DATASET_DOMAINS,
} from "@/lib/constants";
import { OrgCard } from "./OrgCard";
import { OrgTable } from "./OrgTable";
import { OverlapMatrix } from "./OverlapMatrix";

type View = "grid" | "table" | "overlap";

function parseMulti(v: string | null): string[] {
  return v ? v.split(",").filter(Boolean) : [];
}

export function DirectoryView({
  orgs,
  isAdmin = false,
}: {
  orgs: Organization[];
  isAdmin?: boolean;
}) {
  const router = useRouter();
  const params = useSearchParams();

  const q = params.get("q") ?? "";
  const sector = (params.get("sector") ?? "") as Sector | "";
  const type = (params.get("type") ?? "") as OrganizationType | "";
  const caps = parseMulti(params.get("cap")) as Capability[];
  const domains = parseMulti(params.get("domain")) as DatasetDomain[];
  const view: View = (params.get("view") as View) || "grid";

  const fuse = useMemo(
    () =>
      new Fuse(orgs, {
        keys: ["name", "description", "contact_name", "datasets_of_focus"],
        threshold: 0.35,
        ignoreLocation: true,
      }),
    [orgs],
  );

  const filtered = useMemo(() => {
    let list = orgs;
    if (q.trim()) list = fuse.search(q).map((r) => r.item);
    if (sector) list = list.filter((o) => o.sectors.includes(sector));
    if (type) list = list.filter((o) => o.organization_type === type);
    if (caps.length) list = list.filter((o) => caps.every((c) => o.capabilities.includes(c)));
    if (domains.length)
      list = list.filter((o) => domains.every((d) => o.dataset_domains.includes(d)));
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgs, fuse, q, sector, type, caps.join(","), domains.join(",")]);

  function update(next: Record<string, string | string[] | null>) {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v === null || v === "" || (Array.isArray(v) && v.length === 0)) sp.delete(k);
      else sp.set(k, Array.isArray(v) ? v.join(",") : v);
    }
    router.replace(`/directory?${sp.toString()}`, { scroll: false });
  }

  function toggleInArray(current: string[], val: string): string[] {
    return current.includes(val) ? current.filter((x) => x !== val) : [...current, val];
  }

  const hasFilters = Boolean(q || sector || type || caps.length || domains.length);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-nyce-muted mb-3 font-semibold">
            Appendix A
          </p>
          <h1 className="font-display font-bold text-3xl md:text-4xl text-nyce-ink tracking-[-0.02em]">
            Organization Directory
          </h1>
          <p className="mt-2 text-sm text-nyce-slate max-w-2xl">
            Full index of organizations. Use the controls below to filter by sector, type,
            capability, or dataset domain. Filter state is reflected in the URL for sharing.
          </p>
        </div>
        <div className="text-right">
          <div className="font-display font-bold text-3xl text-nyce-accent tabular-nums leading-none">
            n = {filtered.length}
            <span className="text-nyce-muted text-2xl"> / {orgs.length}</span>
          </div>
          <div className="text-[10px] uppercase tracking-wider text-nyce-muted mt-1">
            after filters
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="rounded-2xl border border-nyce-line bg-white p-4 md:p-5 space-y-4 mb-6 shadow-sm">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[280px]">
            <svg
              aria-hidden
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-nyce-muted"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              value={q}
              onChange={(e) => update({ q: e.target.value })}
              placeholder="Search name, description, contact, dataset…"
              className="w-full pl-9 pr-3 py-2.5 rounded-full border border-nyce-line bg-nyce-paper text-sm placeholder:text-nyce-muted/70 focus:outline-none focus:border-nyce-accent focus:ring-2 focus:ring-nyce-accent/20"
            />
          </div>

          <Select
            value={sector}
            onChange={(v) => update({ sector: v })}
            options={[
              { value: "", label: "All sectors" },
              ...SECTORS.map((s) => ({ value: s.value, label: s.label })),
            ]}
          />
          <Select
            value={type}
            onChange={(v) => update({ type: v })}
            options={[{ value: "", label: "All types" }, ...ORGANIZATION_TYPES]}
          />

          <div className="flex rounded-full border border-nyce-line bg-nyce-paper text-sm p-0.5">
            {(["grid", "table", "overlap"] as View[]).map((v) => (
              <button
                key={v}
                onClick={() => update({ view: v === "grid" ? null : v })}
                className={`px-3.5 py-1.5 rounded-full capitalize text-xs font-semibold transition-colors ${
                  view === v
                    ? "bg-nyce-accent text-white"
                    : "text-nyce-muted hover:text-nyce-ink"
                }`}
              >
                {v === "overlap" ? "Overlap" : v}
              </button>
            ))}
          </div>

          <Link
            href="/directory/new"
            className="px-4 py-2 rounded-full border border-nyce-line bg-white text-sm hover:border-nyce-accent/50 hover:text-nyce-accent transition-colors inline-flex items-center gap-1.5 font-medium"
          >
            <span aria-hidden>+</span> Propose org
          </Link>

          {isAdmin && (
            <Link
              href="/admin/bulk-upload"
              className="px-4 py-2 rounded-full border border-nyce-accent bg-nyce-accentSoft text-nyce-accent text-sm hover:bg-nyce-accent hover:text-white transition-colors inline-flex items-center gap-1.5 font-medium"
            >
              Bulk upload
            </Link>
          )}

          <button
            onClick={() => exportCsv(filtered)}
            className="px-4 py-2 rounded-full border border-nyce-line bg-white text-sm hover:border-nyce-accent/50 hover:text-nyce-accent transition-colors inline-flex items-center gap-1.5 font-medium"
          >
            <span>Export</span>
            <span className="text-nyce-muted">CSV</span>
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <FilterGroup
            title="Capabilities"
            options={CAPABILITIES}
            selected={caps}
            onToggle={(c) => update({ cap: toggleInArray(caps, c) })}
          />
          <FilterGroup
            title="Dataset domains"
            options={DATASET_DOMAINS}
            selected={domains}
            onToggle={(d) => update({ domain: toggleInArray(domains, d) })}
          />
        </div>

        {hasFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-nyce-line/70">
            <span className="text-[10px] uppercase tracking-wider text-nyce-muted font-semibold">
              Active filters
            </span>
            {q && <Chip label={`"${q}"`} onRemove={() => update({ q: null })} />}
            {sector && (
              <Chip
                label={SECTORS.find((s) => s.value === sector)?.label ?? sector}
                onRemove={() => update({ sector: null })}
              />
            )}
            {type && <Chip label={type} onRemove={() => update({ type: null })} />}
            {caps.map((c) => (
              <Chip
                key={c}
                label={c}
                onRemove={() => update({ cap: caps.filter((x) => x !== c) })}
              />
            ))}
            {domains.map((d) => (
              <Chip
                key={d}
                label={d}
                onRemove={() => update({ domain: domains.filter((x) => x !== d) })}
              />
            ))}
            <button
              onClick={() =>
                update({ q: null, sector: null, type: null, cap: null, domain: null })
              }
              className="text-xs text-nyce-muted hover:text-nyce-accent underline underline-offset-2 ml-auto font-medium"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {view === "grid" && (
        <>
          {filtered.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((o) => (
                <OrgCard key={o.id} org={o} />
              ))}
            </div>
          )}
        </>
      )}
      {view === "table" && <OrgTable orgs={filtered} />}
      {view === "overlap" && (
        <div className="rounded-2xl border border-nyce-line bg-white p-6 md:p-10 shadow-sm">
          <div className="mb-6 max-w-3xl">
            <p className="text-[11px] uppercase tracking-[0.22em] text-nyce-muted mb-2 font-semibold">
              Figure 1
            </p>
            <h2 className="font-display font-bold text-2xl md:text-3xl text-nyce-ink tracking-[-0.02em]">
              Capability by dataset-domain coverage
            </h2>
            <p className="text-sm text-nyce-slate mt-2 leading-relaxed">
              Cell values indicate the count of organizations reporting both the capability
              (rows) and dataset domain (columns). Intensity scales to the current filtered
              subset (n = {filtered.length}). Empty cells indicate no organizations report both
              attributes. Select any cell to list the organizations at that intersection.
            </p>
          </div>
          <OverlapMatrix orgs={filtered} />
        </div>
      )}
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none pl-4 pr-9 py-2.5 rounded-full border border-nyce-line bg-nyce-paper text-sm hover:border-nyce-accent/40 focus:outline-none focus:border-nyce-accent cursor-pointer font-medium text-nyce-slate"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <span
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-nyce-muted text-xs"
        aria-hidden
      >
        ▾
      </span>
    </div>
  );
}

function FilterGroup<T extends string>({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: readonly T[];
  selected: T[];
  onToggle: (v: T) => void;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.18em] text-nyce-muted mb-2 font-semibold">
        {title}
        {selected.length > 0 && (
          <span className="ml-2 text-nyce-accent">· {selected.length}</span>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const active = selected.includes(o);
          return (
            <button
              key={o}
              onClick={() => onToggle(o)}
              className={`text-xs px-3 py-1 rounded-full border transition-all font-medium ${
                active
                  ? "bg-nyce-accent text-white border-nyce-accent"
                  : "bg-white text-nyce-muted border-nyce-line hover:border-nyce-accent/40 hover:text-nyce-ink"
              }`}
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function exportCsv(orgs: Organization[]) {
  const rows = orgs.map((o) => ({
    id: o.id,
    name: o.name,
    url: o.url,
    description: o.description,
    sectors: JSON.stringify(o.sectors),
    organization_type: o.organization_type,
    engagement_status: o.engagement_status,
    capabilities: JSON.stringify(o.capabilities),
    dataset_domains: JSON.stringify(o.dataset_domains),
    partners: JSON.stringify(o.partners),
    datasets_of_focus: JSON.stringify(o.datasets_of_focus),
    contact_name: o.contact_name ?? "",
    contact_email: o.contact_email ?? "",
    logo_url: o.logo_url ?? "",
    is_verified: String(o.is_verified),
    created_at: o.created_at,
    last_updated: o.last_updated,
  }));
  const csv = Papa.unparse(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `landscape-directory-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs bg-nyce-accent text-white px-2.5 py-1 rounded-full font-medium">
      {label}
      <button
        onClick={onRemove}
        aria-label={`Remove filter ${label}`}
        className="text-white/70 hover:text-white"
      >
        ×
      </button>
    </span>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-nyce-line p-16 text-center bg-white">
      <div className="font-display font-bold text-xl text-nyce-ink mb-2">
        No organizations match the current filter set.
      </div>
      <p className="text-nyce-muted text-sm">Remove one or more filters to broaden results.</p>
    </div>
  );
}
