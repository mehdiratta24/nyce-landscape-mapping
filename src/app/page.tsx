import Link from "next/link";
import { CAPABILITIES, DATASET_DOMAINS, SECTORS } from "@/lib/constants";
import { getAllOrganizations } from "@/lib/data";
import { OverlapMatrix } from "@/components/OverlapMatrix";

export default async function Home() {
  const orgs = await getAllOrganizations();
  const countBySector = orgs.reduce<Record<string, number>>((acc, o) => {
    acc[o.sector] = (acc[o.sector] || 0) + 1;
    return acc;
  }, {});
  const totalCapSlots = orgs.reduce((n, o) => n + o.capabilities.length, 0);
  const totalDomainSlots = orgs.reduce((n, o) => n + o.dataset_domains.length, 0);

  return (
    <>
      {/* HEADER */}
      <section className="relative overflow-hidden bg-white border-b border-nyce-line">
        <div className="absolute inset-0 grid-paper opacity-70 pointer-events-none" aria-hidden />
        <div
          className="absolute -top-40 -right-32 h-[520px] w-[520px] rounded-full blur-3xl opacity-25 pointer-events-none"
          style={{ background: "radial-gradient(circle, #15506C 0%, transparent 70%)" }}
          aria-hidden
        />
        <div
          className="absolute -bottom-40 -left-32 h-[420px] w-[420px] rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ background: "radial-gradient(circle, #FFCA00 0%, transparent 70%)" }}
          aria-hidden
        />

        <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-24">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2.5 text-[11px] uppercase tracking-[0.22em] text-nyce-muted mb-8">
              <span className="inline-flex gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-nyce-yellow" />
                <span className="h-1.5 w-1.5 rounded-full bg-nyce-accent" />
                <span className="h-1.5 w-1.5 rounded-full bg-nyce-aqua" />
              </span>
              Climate Data Stewardship · Working document · v0.1
            </div>
            <h1 className="font-display font-bold text-4xl md:text-6xl leading-[1.05] tracking-[-0.02em] text-nyce-ink text-balance">
              A directory of organizations engaged in the preservation and stewardship of public climate data.
            </h1>
            <p className="mt-8 text-base md:text-lg text-nyce-slate max-w-3xl leading-relaxed">
              This directory catalogs {orgs.length} organizations active in the preservation,
              redistribution, and analysis of federal climate and environmental datasets.
              Organizations are classified by sector, capability, and dataset domain to support
              coordination across preservation networks, data platforms, and research
              institutions.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                href="/directory"
                className="inline-flex items-center gap-2 bg-nyce-accent text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-nyce-accentDark transition-colors"
              >
                View directory
                <span aria-hidden>→</span>
              </Link>
              <Link
                href="/directory?view=overlap"
                className="inline-flex items-center gap-2 border border-nyce-line bg-white px-5 py-2.5 rounded-full text-sm font-semibold hover:border-nyce-accent/50 hover:text-nyce-accent transition-colors"
              >
                View coverage matrix
              </Link>
            </div>
          </div>

          <dl className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-px bg-nyce-line rounded-xl overflow-hidden border border-nyce-line">
            <Stat label="Organizations indexed" value={orgs.length} accent />
            <Stat label="Capability categories" value={CAPABILITIES.length} />
            <Stat label="Dataset domains" value={DATASET_DOMAINS.length} />
            <Stat label="Sector classifications" value={SECTORS.length} />
          </dl>
        </div>
      </section>

      {/* SECTORS */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex items-end justify-between mb-10 flex-wrap gap-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-nyce-muted mb-3 font-semibold">
              Section 1 · Sector classification
            </p>
            <h2 className="font-display font-bold text-3xl md:text-4xl text-nyce-ink tracking-[-0.02em] max-w-2xl">
              Organizations are classified into four sectors by primary function.
            </h2>
          </div>
          <p className="text-nyce-slate max-w-md text-sm leading-relaxed">
            Sector assignment reflects each organization's principal role in the data ecosystem,
            as determined from self-description and external documentation. Select a sector to
            filter the directory.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SECTORS.map((s, i) => (
            <Link
              key={s.value}
              href={`/directory?sector=${s.value}`}
              className={`reveal reveal-delay-${i + 1} group relative overflow-hidden rounded-2xl p-8 min-h-[220px] flex flex-col justify-between border border-nyce-line bg-white hover:border-nyce-accent/40 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-nyce-accent/5 transition-all`}
            >
              <div
                className={`absolute inset-0 opacity-[0.07] group-hover:opacity-[0.12] transition-opacity ${s.gradient}`}
                aria-hidden
              />
              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <div
                    className={`inline-block h-1.5 w-10 rounded-full mb-4 ${s.gradient}`}
                    aria-hidden
                  />
                  <h3 className="font-display font-semibold text-2xl text-nyce-ink tracking-[-0.02em]">
                    {s.label}
                  </h3>
                  <p className="mt-2 text-nyce-slate max-w-sm leading-relaxed text-sm">
                    {s.blurb}
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-display font-bold text-5xl text-nyce-accent tabular-nums leading-none">
                    {countBySector[s.value] ?? 0}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-nyce-muted mt-1">
                    n
                  </div>
                </div>
              </div>
              <div className="relative mt-6 text-xs text-nyce-muted inline-flex items-center gap-2 group-hover:text-nyce-accent transition-colors uppercase tracking-wider font-semibold">
                View sector
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* COVERAGE MATRIX */}
      <section className="bg-white border-y border-nyce-line">
        <div className="max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-[1.1fr_1fr] gap-12 items-start">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-nyce-muted mb-3 font-semibold">
              Section 2 · Coverage matrix
            </p>
            <h2 className="font-display font-bold text-3xl md:text-4xl text-nyce-ink tracking-[-0.02em]">
              Capability by dataset domain.
            </h2>
            <p className="mt-5 text-nyce-slate text-base leading-relaxed max-w-xl">
              The matrix plots each capability against each dataset domain. Cell intensity
              indicates the number of organizations reporting both the capability and the domain.
              Empty cells indicate potential gaps in ecosystem coverage that may warrant further
              investigation.
            </p>
            <dl className="mt-8 grid grid-cols-3 gap-6 text-sm">
              <MiniStat
                label="Capabilities tracked"
                value={totalCapSlots}
                sub={`mean ${(totalCapSlots / orgs.length).toFixed(1)} per org`}
              />
              <MiniStat
                label="Domains tracked"
                value={totalDomainSlots}
                sub={`mean ${(totalDomainSlots / orgs.length).toFixed(1)} per org`}
              />
              <MiniStat
                label="Possible pairings"
                value={CAPABILITIES.length * DATASET_DOMAINS.length}
                sub={`${CAPABILITIES.length} × ${DATASET_DOMAINS.length}`}
              />
            </dl>
            <Link
              href="/directory?view=overlap"
              className="mt-10 inline-flex items-center gap-2 text-sm font-semibold text-nyce-accent hover:text-nyce-accentDark transition-colors"
            >
              View interactive matrix
              <span aria-hidden>→</span>
            </Link>
          </div>
          <figure className="rounded-2xl border border-nyce-line bg-nyce-paper p-6 md:p-8">
            <OverlapMatrix orgs={orgs} interactive={false} />
            <figcaption className="mt-4 text-xs text-nyce-muted leading-relaxed">
              <strong className="text-nyce-ink">Figure 1.</strong> Capability × dataset domain
              coverage, n = {orgs.length}. Values represent the count of organizations reporting
              both attributes.
            </figcaption>
          </figure>
        </div>
      </section>

      {/* VIEWING MODES */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <p className="text-[11px] uppercase tracking-[0.22em] text-nyce-muted mb-3 font-semibold">
          Section 3 · Viewing modes
        </p>
        <h2 className="font-display font-bold text-3xl md:text-4xl text-nyce-ink tracking-[-0.02em] max-w-3xl">
          The directory is available in three views.
        </h2>
        <div className="mt-12 grid md:grid-cols-3 gap-px bg-nyce-line border border-nyce-line rounded-xl overflow-hidden">
          <Guide
            label="3.1"
            title="Grid"
            body="Card layout listing each organization with sector, type, capabilities, and last-updated timestamp. Default view."
          />
          <Guide
            label="3.2"
            title="Table"
            body="Tabular layout with columns sortable by name, sector, type, engagement status, capability count, domain list, partner count, and recency."
          />
          <Guide
            label="3.3"
            title="Coverage matrix"
            body="Capability × dataset domain heatmap. Respects all active filters. Cells are interactive and reveal the orgs at each intersection."
          />
        </div>
      </section>

      {/* METHODOLOGY NOTE */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="rounded-2xl border border-nyce-line bg-white p-8 md:p-10">
          <p className="text-[11px] uppercase tracking-[0.22em] text-nyce-muted mb-3 font-semibold">
            Methodology note
          </p>
          <h2 className="font-display font-bold text-2xl text-nyce-ink tracking-[-0.02em] max-w-2xl mb-4">
            About the data in this directory.
          </h2>
          <div className="grid md:grid-cols-2 gap-6 text-sm text-nyce-slate leading-relaxed">
            <p>
              Records are compiled from public documentation and NYCE engagement activity. Sector
              assignments and capability tags are based on each organization's stated scope;
              partner relationships are extracted from prose descriptions where explicitly
              declared. Duplicate entries have been merged; deprioritized entries are withheld
              from public views.
            </p>
            <p>
              This directory is a working document. Proposed edits from external contributors
              enter a review queue moderated by the NYCE team. The collection will evolve as new
              organizations are identified and existing entries are verified or updated.
              Community contributions will be enabled in the next release.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

function Stat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="bg-white px-6 py-6 md:py-8">
      <div
        className={`font-display font-bold text-4xl md:text-5xl tabular-nums leading-none ${
          accent ? "text-nyce-accent" : "text-nyce-ink"
        }`}
      >
        {value}
      </div>
      <div className="text-[11px] uppercase tracking-wider text-nyce-muted mt-2">{label}</div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  sub,
}: {
  label: string;
  value: number | string;
  sub?: string;
}) {
  return (
    <div>
      <div className="font-display font-bold text-2xl text-nyce-ink tabular-nums">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-nyce-muted mt-0.5">{label}</div>
      {sub && <div className="text-[10px] text-nyce-muted/80 mt-0.5">{sub}</div>}
    </div>
  );
}

function Guide({
  label,
  title,
  body,
}: {
  label: string;
  title: string;
  body: string;
}) {
  return (
    <div className="bg-white p-8">
      <div className="text-[11px] font-mono text-nyce-accent font-semibold mb-4 tabular-nums">
        §{label}
      </div>
      <h3 className="font-display font-semibold text-xl text-nyce-ink tracking-[-0.02em] mb-3">
        {title}
      </h3>
      <p className="text-nyce-slate leading-relaxed text-sm">{body}</p>
    </div>
  );
}
