import { notFound } from "next/navigation";
import Link from "next/link";
import { getOrganizationById } from "@/lib/data";
import { OrgProposalForm } from "@/components/OrgProposalForm";

export const dynamic = "force-dynamic";

export default async function EditOrgPage({ params }: { params: { id: string } }) {
  const org = await getOrganizationById(params.id);
  if (!org) notFound();

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <Link
        href={`/directory/${org.id}`}
        className="inline-flex items-center gap-1.5 text-sm text-nyce-muted hover:text-nyce-accent transition-colors font-medium mb-6"
      >
        ← Back to {org.name}
      </Link>

      <div className="mb-10 max-w-3xl">
        <p className="text-[11px] uppercase tracking-[0.22em] text-nyce-muted mb-3 font-semibold">
          Propose edit · #{org.id}
        </p>
        <h1 className="font-display font-bold text-3xl md:text-4xl text-nyce-ink tracking-[-0.02em]">
          Suggest changes to {org.name}.
        </h1>
        <p className="mt-3 text-nyce-slate text-sm leading-relaxed">
          The form below is pre-filled with the current record. Adjust any fields that need
          updating. The NYCE team reviews each proposal before publication.
        </p>
      </div>

      <OrgProposalForm org={org} />
    </div>
  );
}
