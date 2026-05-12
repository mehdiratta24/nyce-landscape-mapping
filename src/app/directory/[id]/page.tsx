import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllOrganizations, getOrganizationById } from "@/lib/data";
import { SECTOR_DEF } from "@/lib/constants";
import { hostFromUrl, timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function OrgDetail({ params }: { params: { id: string } }) {
  const org = await getOrganizationById(params.id);
  if (!org) notFound();

  const all = await getAllOrganizations();
  const partners = org.partners
    .map((pid) => all.find((o) => o.id === pid))
    .filter((x): x is NonNullable<typeof x> => Boolean(x));
  const primary = SECTOR_DEF[org.sectors[0] ?? "data_platform"];

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <Link
        href="/directory"
        className="inline-flex items-center gap-1.5 text-sm text-nyce-muted hover:text-nyce-accent transition-colors font-medium"
      >
        <span>←</span> Back to directory
      </Link>

      <article className="mt-6">
        <div
          className={`relative rounded-3xl overflow-hidden ${primary.gradient} p-8 md:p-12 text-white`}
        >
          <div className="absolute inset-0 grid-paper opacity-10" aria-hidden />
          <div className="absolute top-6 right-6 flex flex-wrap gap-1.5 justify-end max-w-[60%]">
            {org.sectors.map((s) => (
              <span
                key={s}
                className="text-[10px] uppercase tracking-wider bg-white/15 backdrop-blur-sm px-2.5 py-1 rounded-full font-semibold"
              >
                {SECTOR_DEF[s].label}
              </span>
            ))}
            {org.is_verified && (
              <span className="text-[10px] uppercase tracking-wider bg-white/15 backdrop-blur-sm px-2.5 py-1 rounded-full font-semibold">
                Verified
              </span>
            )}
          </div>
          <div className="relative max-w-3xl">
            <p className="text-[11px] uppercase tracking-[0.22em] text-white/70 mb-4 font-semibold">
              Organization
            </p>
            <h1 className="font-display font-bold text-4xl md:text-6xl leading-[1.03] tracking-[-0.02em]">
              {org.name}
            </h1>
            {org.url && (
              <a
                href={org.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-sm text-white/85 hover:text-white font-mono"
              >
                {hostFromUrl(org.url)} <span aria-hidden>↗</span>
              </a>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-[1.5fr_1fr] gap-8 mt-10">
          <div className="space-y-10">
            <section>
              <h2 className="text-[11px] uppercase tracking-[0.22em] text-nyce-muted mb-3 font-semibold">
                Overview
              </h2>
              <p className="font-display text-xl md:text-2xl text-nyce-ink leading-relaxed text-pretty">
                {org.description}
              </p>
            </section>

            <StatRow
              items={[
                { label: "Capabilities", value: org.capabilities.length },
                { label: "Dataset domains", value: org.dataset_domains.length },
                { label: "Partners", value: org.partners.length },
                { label: "Type", value: org.organization_type, capitalize: true },
              ]}
            />

            <Section title="Capabilities">
              {org.capabilities.length > 0 ? (
                <TagCluster tags={org.capabilities} tone="capability" />
              ) : (
                <Empty note="None recorded." />
              )}
            </Section>

            <Section title="Dataset domains">
              {org.dataset_domains.length > 0 ? (
                <TagCluster tags={org.dataset_domains} tone="domain" />
              ) : (
                <Empty note="None recorded." />
              )}
            </Section>

            <Section title="Partners">
              {partners.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {partners.map((p) => {
                    const ps = SECTOR_DEF[p.sectors[0] ?? "data_platform"];
                    return (
                      <Link
                        key={p.id}
                        href={`/directory/${p.id}`}
                        className="group inline-flex items-center gap-2 text-sm px-3 py-1.5 bg-white border border-nyce-line rounded-full hover:border-nyce-accent/40 transition-colors"
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ background: ps.color }}
                          aria-hidden
                        />
                        {p.name}
                        <span className="text-nyce-muted text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                          →
                        </span>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <Empty note="No partner references detected in the description text." />
              )}
            </Section>

            <Section title="Datasets of focus">
              {org.datasets_of_focus.length > 0 ? (
                <TagCluster tags={org.datasets_of_focus} tone="dataset" />
              ) : (
                <Empty note="None recorded." />
              )}
            </Section>
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-nyce-line bg-white p-6">
              <h3 className="text-[11px] uppercase tracking-[0.22em] text-nyce-muted mb-4 font-semibold">
                Engagement
              </h3>
              <div className="flex items-center gap-3">
                <span
                  className={`h-2 w-2 rounded-full ${
                    org.engagement_status === "active"
                      ? "bg-nyce-accent"
                      : org.engagement_status === "in_contact"
                      ? "bg-nyce-yellow"
                      : "bg-nyce-muted"
                  }`}
                  aria-hidden
                />
                <span className="font-display font-semibold text-xl text-nyce-ink capitalize">
                  {org.engagement_status.replace("_", " ")}
                </span>
              </div>
              <p className="mt-3 text-xs text-nyce-muted leading-relaxed">
                {org.engagement_status === "active"
                  ? "Active engagement between NYCE and this organization is ongoing."
                  : org.engagement_status === "in_contact"
                  ? "Initial contact established; engagement is not yet active."
                  : "Record is admin-only and withheld from public views."}
              </p>
            </div>

            {(org.contact_name || org.contact_email) && (
              <div className="rounded-2xl border border-nyce-line bg-white p-6">
                <h3 className="text-[11px] uppercase tracking-[0.22em] text-nyce-muted mb-4 font-semibold">
                  Contact
                </h3>
                {org.contact_name && (
                  <p className="font-display font-semibold text-xl text-nyce-ink">
                    {org.contact_name}
                  </p>
                )}
                {org.contact_email && (
                  <a
                    href={`mailto:${org.contact_email}`}
                    className="mt-1 block text-sm text-nyce-muted hover:text-nyce-accent font-mono break-all"
                  >
                    {org.contact_email}
                  </a>
                )}
              </div>
            )}

            <div className="rounded-2xl border border-nyce-line bg-white p-6 text-xs text-nyce-muted space-y-1.5">
              <div className="flex justify-between">
                <span>Last updated</span>
                <span className="text-nyce-ink">{timeAgo(org.last_updated)}</span>
              </div>
              <div className="flex justify-between">
                <span>Created</span>
                <span className="text-nyce-ink">{timeAgo(org.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span>ID</span>
                <span className="text-nyce-ink font-mono">#{org.id}</span>
              </div>
            </div>

            <Link
              href={`/directory/${org.id}/edit`}
              className="block text-center w-full rounded-full bg-nyce-accent text-white py-3 text-sm hover:bg-nyce-accentDark transition-colors font-medium"
            >
              Propose an edit →
            </Link>
          </aside>
        </div>
      </article>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-[11px] uppercase tracking-[0.22em] text-nyce-muted mb-3 font-semibold">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Empty({ note }: { note: string }) {
  return <p className="text-sm text-nyce-muted italic">{note}</p>;
}

function StatRow({
  items,
}: {
  items: { label: string; value: number | string; capitalize?: boolean }[];
}) {
  return (
    <dl className="grid grid-cols-2 md:grid-cols-4 gap-px bg-nyce-line rounded-xl overflow-hidden border border-nyce-line">
      {items.map((i) => (
        <div key={i.label} className="bg-white px-5 py-4">
          <dd
            className={`font-display font-bold text-2xl text-nyce-ink tabular-nums ${
              i.capitalize ? "capitalize" : ""
            }`}
          >
            {i.value}
          </dd>
          <dt className="text-[10px] uppercase tracking-wider text-nyce-muted mt-1">
            {i.label}
          </dt>
        </div>
      ))}
    </dl>
  );
}

function TagCluster({
  tags,
  tone,
}: {
  tags: readonly string[];
  tone: "capability" | "domain" | "dataset";
}) {
  const styles: Record<typeof tone, string> = {
    capability: "bg-white border-nyce-line text-nyce-ink",
    domain: "bg-nyce-accentSoft border-nyce-accent/30 text-nyce-accent",
    dataset: "bg-nyce-yellowSoft border-nyce-yellow/40 text-[#7C5F00]",
  };
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((t) => (
        <span key={t} className={`text-xs px-3 py-1.5 border rounded-full ${styles[tone]}`}>
          {t}
        </span>
      ))}
    </div>
  );
}
