import Link from "next/link";
import type { Organization } from "@/lib/types";
import { SECTOR_DEF } from "@/lib/constants";
import { timeAgo, hostFromUrl } from "@/lib/utils";

export function OrgCard({ org }: { org: Organization }) {
  const primary = SECTOR_DEF[org.sectors[0] ?? "data_platform"];
  const extraCaps = Math.max(0, org.capabilities.length - 3);

  return (
    <Link
      href={`/directory/${org.id}`}
      className="group relative flex flex-col rounded-2xl border border-nyce-line bg-white hover:border-nyce-accent/40 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-nyce-accent/5 transition-all overflow-hidden min-h-[240px]"
    >
      <div className={`h-1.5 w-full ${primary.gradient}`} aria-hidden />

      <div className="flex-1 flex flex-col p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {org.sectors.length > 0 ? (
              org.sectors.map((s) => {
                const def = SECTOR_DEF[s];
                return (
                  <span
                    key={s}
                    className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full ${def.chipClass}`}
                  >
                    {def.short}
                  </span>
                );
              })
            ) : (
              <span className="text-[10px] uppercase tracking-wider text-nyce-muted">
                Unclassified
              </span>
            )}
            <span className="text-[10px] uppercase tracking-wider text-nyce-muted px-2 py-0.5 rounded-full bg-nyce-paper border border-nyce-line capitalize">
              {org.organization_type}
            </span>
            {org.is_verified && (
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-nyce-accentSoft text-nyce-accent">
                Verified
              </span>
            )}
          </div>
          {org.engagement_status !== "active" && (
            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-nyce-yellowSoft text-[#7C5F00] capitalize">
              {org.engagement_status.replace("_", " ")}
            </span>
          )}
        </div>

        <h3 className="font-display font-semibold text-xl text-nyce-ink leading-snug tracking-[-0.02em] group-hover:text-nyce-accent transition-colors">
          {org.name}
        </h3>

        {org.url && (
          <p className="mt-1 text-xs text-nyce-muted font-mono truncate">
            {hostFromUrl(org.url)}
          </p>
        )}

        <p className="mt-3 text-sm text-nyce-slate leading-relaxed line-clamp-3 flex-1">
          {org.description}
        </p>

        {org.capabilities.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1">
            {org.capabilities.slice(0, 3).map((c) => (
              <span
                key={c}
                className="text-[10px] px-1.5 py-0.5 rounded border border-nyce-line bg-nyce-paper text-nyce-muted"
              >
                {c}
              </span>
            ))}
            {extraCaps > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 text-nyce-muted">+{extraCaps}</span>
            )}
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-nyce-line/70 flex items-center justify-between text-[11px] text-nyce-muted">
          <span className="inline-flex items-center gap-1">
            <span className="h-1 w-1 rounded-full bg-nyce-muted/50" aria-hidden />
            Updated {timeAgo(org.last_updated)}
          </span>
          {org.contact_name && <span className="truncate max-w-[50%]">{org.contact_name}</span>}
        </div>
      </div>
    </Link>
  );
}
