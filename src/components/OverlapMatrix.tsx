"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Organization, Capability, DatasetDomain } from "@/lib/types";
import {
  CAPABILITIES,
  DATASET_DOMAINS,
  SECTOR_COLOR,
} from "@/lib/constants";

interface Props {
  orgs: Organization[];
  compact?: boolean;
  interactive?: boolean;
}

// NYCE accent #15506C as the heatmap base
const BASE_R = 21;
const BASE_G = 80;
const BASE_B = 108;

export function OverlapMatrix({ orgs, compact = false, interactive = true }: Props) {
  const [selected, setSelected] = useState<{ cap: Capability; dom: DatasetDomain } | null>(
    null,
  );

  const { grid, max, total } = useMemo(() => {
    const g: Record<string, Organization[]> = {};
    let m = 0;
    let t = 0;
    for (const cap of CAPABILITIES) {
      for (const dom of DATASET_DOMAINS) {
        const matches = orgs.filter(
          (o) => o.capabilities.includes(cap) && o.dataset_domains.includes(dom),
        );
        g[`${cap}|${dom}`] = matches;
        if (matches.length > m) m = matches.length;
        t += matches.length;
      }
    }
    return { grid: g, max: Math.max(m, 1), total: t };
  }, [orgs]);

  const cellSize = compact ? 28 : 52;
  const capLabelWidth = compact ? 0 : 148;
  const domLabelHeight = compact ? 0 : 44;

  function intensity(n: number): React.CSSProperties {
    if (n === 0) {
      return { background: "#EEF2F4", color: "#B5C2CB" };
    }
    const t = 0.18 + 0.82 * (n / max);
    return {
      background: `rgba(${BASE_R}, ${BASE_G}, ${BASE_B}, ${t})`,
      color: t > 0.5 ? "#FFFFFF" : "#0A1117",
    };
  }

  const selectedMatches = selected ? grid[`${selected.cap}|${selected.dom}`] ?? [] : [];

  return (
    <div>
      <div
        className="grid gap-[3px]"
        style={{
          gridTemplateColumns: compact
            ? `repeat(${DATASET_DOMAINS.length}, ${cellSize}px)`
            : `${capLabelWidth}px repeat(${DATASET_DOMAINS.length}, 1fr)`,
        }}
      >
        {!compact && <div />}
        {!compact &&
          DATASET_DOMAINS.map((d) => (
            <div
              key={d}
              className="text-[10px] uppercase tracking-wider text-nyce-muted font-semibold flex items-end pb-2 px-1 leading-tight"
              style={{ minHeight: domLabelHeight }}
            >
              {d}
            </div>
          ))}

        {CAPABILITIES.map((cap) => (
          <FragmentRow
            key={cap}
            cap={cap}
            grid={grid}
            cellSize={cellSize}
            compact={compact}
            intensity={intensity}
            interactive={interactive}
            selected={selected}
            onSelect={(dom) =>
              setSelected((cur) =>
                cur && cur.cap === cap && cur.dom === dom ? null : { cap, dom },
              )
            }
          />
        ))}
      </div>

      {!compact && (
        <div className="mt-4 flex items-center justify-between text-xs text-nyce-muted flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="uppercase tracking-wider font-semibold">Intensity</span>
            <div className="flex h-2.5 w-36 overflow-hidden rounded-full border border-nyce-line">
              {[0.2, 0.4, 0.6, 0.8, 1].map((t) => (
                <div
                  key={t}
                  className="flex-1"
                  style={{ background: `rgba(${BASE_R},${BASE_G},${BASE_B},${t})` }}
                />
              ))}
            </div>
            <span>0 → {max} orgs</span>
          </div>
          <span>
            <strong className="text-nyce-ink tabular-nums">{total}</strong> coverage pairings
            across <strong className="text-nyce-ink tabular-nums">{orgs.length}</strong> orgs
          </span>
        </div>
      )}

      {interactive && selected && (
        <div className="mt-5 rounded-xl border border-nyce-line bg-white p-5 animate-fade-in">
          <div className="flex items-baseline justify-between gap-4 flex-wrap">
            <h3 className="font-display font-semibold text-lg text-nyce-ink tracking-[-0.01em]">
              {selected.cap}{" "}
              <span className="text-nyce-muted font-sans text-sm">×</span> {selected.dom}
            </h3>
            <button
              onClick={() => setSelected(null)}
              className="text-xs text-nyce-muted hover:text-nyce-accent underline underline-offset-2"
            >
              Close
            </button>
          </div>
          {selectedMatches.length === 0 ? (
            <p className="mt-3 text-sm text-nyce-muted">
              No organizations have both this capability and this dataset domain. A potential
              ecosystem gap.
            </p>
          ) : (
            <ul className="mt-3 grid md:grid-cols-2 gap-2">
              {selectedMatches.map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/directory/${o.id}`}
                    className="flex items-center gap-3 rounded-md p-2 hover:bg-nyce-paper transition-colors"
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: SECTOR_COLOR[o.sectors[0] ?? "data_platform"] }}
                      aria-hidden
                    />
                    <span className="text-sm text-nyce-ink truncate">{o.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function FragmentRow({
  cap,
  grid,
  cellSize,
  compact,
  intensity,
  interactive,
  selected,
  onSelect,
}: {
  cap: Capability;
  grid: Record<string, Organization[]>;
  cellSize: number;
  compact: boolean;
  intensity: (n: number) => React.CSSProperties;
  interactive: boolean;
  selected: { cap: Capability; dom: DatasetDomain } | null;
  onSelect: (dom: DatasetDomain) => void;
}) {
  return (
    <>
      {!compact && (
        <div className="text-xs text-nyce-muted flex items-center pr-2 justify-end text-right">
          {cap}
        </div>
      )}
      {DATASET_DOMAINS.map((dom) => {
        const cell = grid[`${cap}|${dom}`] ?? [];
        const n = cell.length;
        const isSelected = selected?.cap === cap && selected?.dom === dom;
        const common: React.CSSProperties = {
          ...intensity(n),
          minHeight: cellSize,
        };
        const topNames = cell.slice(0, 3).map((o) => o.name).join(", ");
        const titleText =
          n === 0
            ? `${cap} × ${dom}: no coverage`
            : `${cap} × ${dom}: ${n} org${n === 1 ? "" : "s"}${topNames ? ` — ${topNames}` : ""}`;

        const content = (
          <div
            className="w-full h-full flex items-center justify-center font-mono text-xs tabular-nums transition-transform"
            style={common}
          >
            {compact ? (n > 0 ? <span className="text-[10px]">{n}</span> : null) : n}
          </div>
        );

        if (!interactive) {
          return (
            <div key={dom} title={titleText} className="overflow-hidden rounded-sm">
              {content}
            </div>
          );
        }
        return (
          <button
            key={dom}
            title={titleText}
            onClick={() => onSelect(dom)}
            className={`relative overflow-hidden rounded-sm outline-none transition-transform hover:scale-[1.04] focus-visible:ring-2 focus-visible:ring-nyce-yellow ${
              isSelected ? "ring-2 ring-nyce-accent" : ""
            }`}
          >
            {content}
          </button>
        );
      })}
    </>
  );
}
