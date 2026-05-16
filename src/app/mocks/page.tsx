import Link from "next/link";
import { getAllOrganizations } from "@/lib/data";
import {
  CAPABILITIES,
  DATASET_DOMAINS,
  ORGANIZATION_TYPES,
} from "@/lib/constants";
import type { Capability, DatasetDomain, OrganizationType } from "@/lib/types";

export const dynamic = "force-dynamic";

const STAKEHOLDER_CAPS: { value: Capability; label: string; short: string; blurb: string; tone: string }[] = [
  {
    value: "Stakeholders: Community & Civic",
    label: "Community & Civic",
    short: "Civic",
    blurb:
      "Coalitions, public-access archives, and ad-hoc groups working with local communities, civil society, and the general public.",
    tone: "bg-sector-preservation",
  },
  {
    value: "Stakeholders: Research",
    label: "Research",
    short: "Research",
    blurb:
      "Universities, scholarly societies, and repositories serving researchers, scientists, and the academic data community.",
    tone: "bg-sector-academia",
  },
  {
    value: "Stakeholders: Private Sector",
    label: "Private Sector",
    short: "Private",
    blurb:
      "Companies, industry platforms, and organizations whose work intersects with corporate, financial, and commercial use of public data.",
    tone: "bg-sector-platform",
  },
];

const ORG_TYPE_BLURB: Record<OrganizationType, string> = {
  nonprofit: "Mission-driven organizations",
  academic: "Universities and scholarly bodies",
  company: "For-profit data platforms and vendors",
  government: "Public-sector data producers",
  independent: "Independent efforts",
};

const DOMAIN_BLURB: Partial<Record<DatasetDomain, string>> = {
  "Climate & Earth Science": "Atmospheric, oceanic, terrestrial systems.",
  "Greenhouse Gas & Emissions": "GHGRP, inventories, point-source data.",
  Energy: "Production, consumption, infrastructure.",
  "Extreme Weather & Hazards": "Storms, floods, wildfire, drought.",
  "Environmental Health & Justice": "Exposure, EJ communities, health outcomes.",
  "Geospatial & Remote Sensing": "Satellite, aerial, spatial data.",
  Socioeconomic: "Census, economic, demographic data.",
};

export default async function MocksPage() {
  const orgs = await getAllOrganizations();

  const stakeholderCount = STAKEHOLDER_CAPS.map((s) => ({
    ...s,
    n: orgs.filter((o) => o.capabilities.includes(s.value)).length,
  }));

  const typeCount = ORGANIZATION_TYPES.map((t) => ({
    ...t,
    n: orgs.filter((o) => o.organization_type === t.value).length,
  })).filter((t) => t.n > 0);

  const domainCount = DATASET_DOMAINS.map((d) => ({
    label: d,
    blurb: DOMAIN_BLURB[d] ?? "",
    n: orgs.filter((o) => o.dataset_domains.includes(d)).length,
  })).sort((a, b) => b.n - a.n);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-20">
      <header>
        <p className="text-[11px] uppercase tracking-[0.22em] text-nyce-muted mb-3 font-semibold">
          Home page · section 1 variants
        </p>
        <h1 className="font-display font-bold text-3xl md:text-4xl text-nyce-ink tracking-[-0.02em]">
          Three options for replacing the sector quadrants.
        </h1>
        <p className="mt-3 text-nyce-slate max-w-2xl text-sm leading-relaxed">
          The hero, coverage-matrix preview, and methodology note stay the same in all
          three. Only the section directly under the hero changes. Real counts shown
          (n = {orgs.length}).
        </p>
      </header>

      {/* ───────── A ───────── */}
      <Variant
        letter="A"
        title="Stakeholders only"
        body="Three big cards, mirroring the old sector quadrants. Cleanest and most focused."
      >
        <StakeholdersStrip data={stakeholderCount} />
      </Variant>

      {/* ───────── B (recommendation) ───────── */}
      <Variant
        letter="B"
        title="Stakeholders + organization-type chip strip"
        body="Same three stakeholder cards plus a small chip strip below for type counts. Adds a second way in without much visual weight."
        recommended
      >
        <StakeholdersStrip data={stakeholderCount} />
        <div className="mt-8 rounded-2xl border border-nyce-line bg-white px-6 py-5">
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
              {typeCount.map((t) => (
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
      </Variant>

      {/* ───────── C ───────── */}
      <Variant
        letter="C"
        title="Stakeholders + dataset-domain mini-cards"
        body="Three stakeholder cards plus a 7-up grid of domain mini-cards. Most information density but visually busier."
      >
        <StakeholdersStrip data={stakeholderCount} />
        <div className="mt-10">
          <div className="flex items-end justify-between mb-4 flex-wrap gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-nyce-muted font-semibold">
                By dataset domain
              </p>
              <p className="text-sm text-nyce-slate mt-1">
                Click any domain to filter the directory.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {domainCount.map((d) => (
              <Link
                key={d.label}
                href={`/directory?domain=${encodeURIComponent(d.label)}`}
                className="group block rounded-xl border border-nyce-line bg-white p-4 hover:border-nyce-accent/40 hover:-translate-y-0.5 transition-all"
              >
                <div className="font-display font-bold text-2xl text-nyce-accent tabular-nums leading-none">
                  {d.n}
                </div>
                <div className="mt-2 text-xs font-semibold text-nyce-ink leading-tight">
                  {d.label}
                </div>
                {d.blurb && (
                  <div className="mt-1 text-[10px] text-nyce-muted leading-tight">
                    {d.blurb}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      </Variant>

      {/* footer */}
      <div className="rounded-2xl border border-dashed border-nyce-line p-8 bg-white">
        <p className="text-sm text-nyce-slate">
          When you've picked one, reply with the letter and I'll wire it into the actual
          home page (this <code className="font-mono text-xs">/mocks</code> route is
          temporary and can be removed after).
        </p>
      </div>
    </div>
  );
}

function Variant({
  letter,
  title,
  body,
  recommended,
  children,
}: {
  letter: string;
  title: string;
  body: string;
  recommended?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="border-t border-nyce-line pt-8 mb-8 flex items-baseline gap-4 flex-wrap">
        <div className="font-display font-bold text-5xl text-nyce-accent tabular-nums">
          {letter}
        </div>
        <div className="flex-1 min-w-[200px]">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-display font-bold text-2xl text-nyce-ink tracking-[-0.02em]">
              {title}
            </h2>
            {recommended && (
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-nyce-accent text-white font-semibold">
                Recommended
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-nyce-slate leading-relaxed max-w-2xl">{body}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function StakeholdersStrip({
  data,
}: {
  data: Array<{ value: Capability; label: string; short: string; blurb: string; tone: string; n: number }>;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {data.map((s) => (
        <Link
          key={s.value}
          href={`/directory?cap=${encodeURIComponent(s.value)}`}
          className="group relative overflow-hidden rounded-2xl p-7 min-h-[200px] flex flex-col justify-between border border-nyce-line bg-white hover:border-nyce-accent/40 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-nyce-accent/5 transition-all"
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
              <div className="text-[10px] uppercase tracking-wider text-nyce-muted mt-1">
                n
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
  );
}
