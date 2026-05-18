import Link from "next/link";
import {
  CAPABILITIES,
  DATASET_DOMAINS,
  ORGANIZATION_TYPES,
} from "@/lib/constants";
import { getAllOrganizations } from "@/lib/data";
import { OverlapMatrix } from "@/components/OverlapMatrix";
import type { Capability } from "@/lib/types";

export default async function Home() {
  const orgs = await getAllOrganizations();

  const stakeholders: {
    value: Capability;
    label: string;
    blurb: string;
    tone: string;
  }[] = [
    {
      value: "Stakeholders: Community & Civic",
      label: "Community & Civic",
      blurb:
        "Coalitions, public-access archives, and ad-hoc groups working with local communities, civil society, and the broader public.",
      tone: "bg-sector-preservation",
    },
    {
      value: "Stakeholders: Research",
      label: "Scientific & Research",
      blurb:
        "Universities, scholarly societies, and repositories serving researchers, scientists, and the academic data community.",
      tone: "bg-sector-academia",
    },
    {
      value: "Stakeholders: Private Sector",
      label: "Private Sector",
      blurb:
        "Companies, industry platforms, and organizations whose work intersects with corporate, financial, and commercial use of public data.",
      tone: "bg-sector-platform",
    },
  ];

  const stakeholderCounts = stakeholders.map((s) => ({
    ...s,
    n: orgs.filter((o) => o.capabilities.includes(s.value)).length,
  }));

  const typeCounts = ORGANIZATION_TYPES.map((t) => ({
    ...t,
    n: orgs.filter((o) => o.organization_type === t.value).length,
  })).filter((t) => t.n > 0);

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
              Climate Data Stewardship Initiative · Landscape Mapping Tool · Confidential
            </div>
            <h1 className="font-display font-bold text-4xl md:text-6xl leading-[1.05] tracking-[-0.02em] text-nyce-ink text-balance">
              A directory of organizations engaged in the preservation and stewardship of climate data.
            </h1>
            <div className="mt-8 space-y-4 max-w-3xl text-base md:text-lg text-nyce-slate leading-relaxed">
              <p>
                The Exchange, alongside key ecosystem partners, has mapped {orgs.length} data
                preservation efforts across the ecosystem preservation groups, data platforms, and
                academic institutions. These organizations are each playing distinct, complementary
                roles: preserving and safeguarding datasets; improving metadata and cataloging;
                developing open data governance models; and building scalable research
                infrastructure.
              </p>
              <p>
                Organizations are tagged by stakeholder type, their capabilities and their dataset
                domains, across community & civic, scientific and research, and private sector.
              </p>
            </div>
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
            <Stat label="Stakeholder groups" value={stakeholders.length} />
          </dl>
        </div>
      </section>

      {/* SECTION 1 — STAKEHOLDERS */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="mb-10">
          <p className="text-[11px] uppercase tracking-[0.22em] text-nyce-muted mb-3 font-semibold">
            Stakeholders Mapped
          </p>
          <h2 className="font-display font-bold text-3xl md:text-4xl text-nyce-ink tracking-[-0.02em] max-w-3xl">
            Each organization is tagged by the stakeholder groups.
          </h2>
        </div>
        <p className="text-xs text-nyce-muted mb-3 italic">
          An organization may be tagged with more than one stakeholder group, so the counts below
          add up to more than the {orgs.length} indexed organizations.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stakeholderCounts.map((s, i) => (
            <Link
              key={s.value}
              href={`/directory?cap=${encodeURIComponent(s.value)}`}
              className={`reveal reveal-delay-${i + 1} group relative overflow-hidden rounded-2xl p-7 min-h-[220px] flex flex-col justify-between border border-nyce-line bg-white hover:border-nyce-accent/40 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-nyce-accent/5 transition-all`}
            >
              <div
                className={`absolute inset-0 opacity-[0.07] group-hover:opacity-[0.12] transition-opacity ${s.tone}`}
                aria-hidden
              />
              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <div
                    className={`inline-block h-1.5 w-10 rounded-full mb-4 ${s.tone}`}
                    aria-hidden
                  />
                  <p className="text-[11px] uppercase tracking-[0.18em] text-nyce-muted font-semibold mb-1.5">
                    Stakeholder
                  </p>
                  <h3 className="font-display font-semibold text-2xl text-nyce-ink tracking-[-0.02em]">
                    {s.label}
                  </h3>
                  <p className="mt-2 text-sm text-nyce-slate leading-relaxed">{s.blurb}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-display font-bold text-5xl text-nyce-accent tabular-nums leading-none">
                    {s.n}
                  </div>
                </div>
              </div>
              <div className="relative mt-6 text-xs text-nyce-muted inline-flex items-center gap-2 group-hover:text-nyce-accent transition-colors uppercase tracking-wider font-semibold">
                Filter directory
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Organization-type chip strip */}
        <div className="mt-6 rounded-2xl border border-nyce-line bg-white px-6 py-5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-nyce-muted font-semibold">
                By organization type
              </p>
              <p className="text-sm text-nyce-slate mt-1">
                Distribution of the {orgs.length} indexed organizations.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {typeCounts.map((t) => (
                <Link
                  key={t.value}
                  href={`/directory?type=${t.value}`}
                  className="inline-flex items-baseline gap-2 px-4 py-2 rounded-full border border-nyce-line bg-nyce-paper hover:border-nyce-accent/40 hover:bg-white transition-colors"
                >
                  <span className="font-display font-bold text-lg text-nyce-accent tabular-nums">
                    {t.n}
                  </span>
                  <span className="text-xs text-nyce-slate font-medium">{t.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* COVERAGE MATRIX — hidden on mobile */}
      <section className="hidden md:block bg-white border-y border-nyce-line">
        <div className="max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-[1.1fr_1fr] gap-12 items-start">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-nyce-muted mb-3 font-semibold">
              Coverage matrix
            </p>
            <h2 className="font-display font-bold text-3xl md:text-4xl text-nyce-ink tracking-[-0.02em]">
              Mapping Capabilities and Dataset domains
            </h2>
            <p className="mt-5 text-nyce-slate text-base leading-relaxed max-w-xl">
              The matrix plots each capability against each dataset domain. Cell intensity
              indicates the number of organizations reporting both the capability and the domain.
              Empty cells indicate potential gaps in ecosystem coverage that may warrant further
              investigation.
            </p>
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

      {/* VIEWING MODES — hidden on mobile */}
      <section className="hidden md:block max-w-7xl mx-auto px-6 py-20">
        <p className="text-[11px] uppercase tracking-[0.22em] text-nyce-muted mb-3 font-semibold">
          Using this tool
        </p>
        <h2 className="font-display font-bold text-3xl md:text-4xl text-nyce-ink tracking-[-0.02em] max-w-3xl">
          The directory is available in three views.
        </h2>
        <div className="mt-12 grid md:grid-cols-3 gap-px bg-nyce-line border border-nyce-line rounded-xl overflow-hidden">
          <Guide
            label="3.1"
            title="Grid"
            body="Card layout listing each organization with type, capabilities, and last-updated timestamp. Default view."
          />
          <Guide
            label="3.2"
            title="Table"
            body="Tabular layout with columns sortable by name, type, capability count, domain list, coordination count, and recency."
          />
          <Guide
            label="3.3"
            title="Coverage matrix"
            body="Capability × dataset domain heatmap. Respects all active filters. Cells are interactive and reveal the orgs at each intersection."
          />
        </div>
      </section>

      {/* METHODOLOGY NOTE — hidden on mobile */}
      <section className="hidden md:block max-w-7xl mx-auto px-6 pb-20">
        <div className="rounded-2xl border border-nyce-line bg-white p-8 md:p-10">
          <p className="text-[11px] uppercase tracking-[0.22em] text-nyce-muted mb-3 font-semibold">
            Methodology note
          </p>
          <h2 className="font-display font-bold text-2xl text-nyce-ink tracking-[-0.02em] max-w-2xl mb-4">
            About the data in this directory.
          </h2>
          <div className="grid md:grid-cols-2 gap-6 text-sm text-nyce-slate leading-relaxed">
            <div className="space-y-3">
              <p>
                This information has been collected in partnership with organizations that the
                New York Climate Exchange has engaged directly. The records are a combination of
                information available online, in addition to stakeholder mapping exercises
                conducted by the ecosystem as a whole. Organizations that have supported this
                include: PEDP members, Data Foundation, and others.
              </p>
              <p>
                Capability and stakeholder tags reflect each organization's stated scope;
                coordination relationships are extracted from prose descriptions where explicitly
                declared.
              </p>
            </div>
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
