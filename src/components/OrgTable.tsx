"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Organization } from "@/lib/types";
import { SECTOR_DEF } from "@/lib/constants";
import { timeAgo } from "@/lib/utils";

type SortKey =
  | "name"
  | "sector"
  | "organization_type"
  | "capabilities"
  | "dataset_domains"
  | "coordinates_with"
  | "last_updated";

export function OrgTable({ orgs }: { orgs: Organization[] }) {
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "name",
    dir: "asc",
  });

  const sorted = useMemo(() => {
    const toVal = (o: Organization): string | number => {
      switch (sort.key) {
        case "name":
          return o.name.toLowerCase();
        case "sector":
          return o.sectors.map((s) => SECTOR_DEF[s].short).join(",");
        case "organization_type":
          return o.organization_type;
        case "capabilities":
          return o.capabilities.length;
        case "dataset_domains":
          return o.dataset_domains.join(",");
        case "coordinates_with":
          return o.partners.length;
        case "last_updated":
          return new Date(o.last_updated).getTime() || 0;
      }
    };
    const copy = [...orgs];
    copy.sort((a, b) => {
      const av = toVal(a);
      const bv = toVal(b);
      if (av < bv) return sort.dir === "asc" ? -1 : 1;
      if (av > bv) return sort.dir === "asc" ? 1 : -1;
      return 0;
    });
    return copy;
  }, [orgs, sort]);

  const header = (key: SortKey, label: string) => (
    <th className="text-left font-semibold text-nyce-muted px-3 py-3 border-b border-nyce-line text-[11px] uppercase tracking-wider">
      <button
        onClick={() =>
          setSort((s) =>
            s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" },
          )
        }
        className="hover:text-nyce-accent flex items-center gap-1"
      >
        {label}
        {sort.key === key && (
          <span className="text-nyce-accent">{sort.dir === "asc" ? "▲" : "▼"}</span>
        )}
      </button>
    </th>
  );

  return (
    <div className="overflow-x-auto border border-nyce-line rounded-2xl bg-white">
      <table className="w-full text-sm">
        <thead className="bg-nyce-paper">
          <tr>
            {header("name", "Name")}
            {header("sector", "Sector")}
            {header("organization_type", "Type")}
            {header("capabilities", "Caps")}
            {header("dataset_domains", "Domains")}
            {header("coordinates_with", "Coordinates with")}
            {header("last_updated", "Updated")}
          </tr>
        </thead>
        <tbody>
          {sorted.map((o) => {
            const primary = SECTOR_DEF[o.sectors[0] ?? "data_platform"];
            return (
              <tr
                key={o.id}
                className="hover:bg-nyce-paper border-b border-nyce-line/60 last:border-0 transition-colors"
              >
                <td className="px-3 py-3">
                  <Link
                    href={`/directory/${o.id}`}
                    className="inline-flex items-center gap-2 text-nyce-ink font-semibold hover:text-nyce-accent"
                  >
                    <span
                      className="h-2 w-2 rounded-full flex-shrink-0"
                      style={{ background: primary.color }}
                      aria-hidden
                    />
                    {o.name}
                  </Link>
                </td>
                <td className="px-3 py-3 text-nyce-muted">
                  {o.sectors.map((s) => SECTOR_DEF[s].short).join(", ") || "—"}
                </td>
                <td className="px-3 py-3 text-nyce-muted capitalize">{o.organization_type}</td>
                <td className="px-3 py-3 text-nyce-muted tabular-nums font-mono text-xs">
                  {o.capabilities.length}
                </td>
                <td className="px-3 py-3 text-nyce-muted text-xs">
                  {o.dataset_domains.join(", ") || "—"}
                </td>
                <td className="px-3 py-3 text-nyce-muted tabular-nums font-mono text-xs">
                  {o.partners.length}
                </td>
                <td className="px-3 py-3 text-nyce-muted whitespace-nowrap text-xs">
                  {timeAgo(o.last_updated)}
                </td>
              </tr>
            );
          })}
          {sorted.length === 0 && (
            <tr>
              <td colSpan={7} className="px-3 py-10 text-center text-nyce-muted">
                No organizations match these filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
