import Link from "next/link";
import { OrgProposalForm } from "@/components/OrgProposalForm";

export const dynamic = "force-dynamic";

export default function NewOrgPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <Link
        href="/directory"
        className="inline-flex items-center gap-1.5 text-sm text-nyce-muted hover:text-nyce-accent transition-colors font-medium mb-6"
      >
        ← Back to directory
      </Link>

      <div className="mb-10 max-w-3xl">
        <p className="text-[11px] uppercase tracking-[0.22em] text-nyce-muted mb-3 font-semibold">
          Contribute
        </p>
        <h1 className="font-display font-bold text-3xl md:text-4xl text-nyce-ink tracking-[-0.02em]">
          Propose a new organization.
        </h1>
        <p className="mt-3 text-nyce-slate text-sm leading-relaxed">
          Submit an organization for inclusion in the directory. The NYCE team reviews each
          proposal before publication; you'll be contacted at the email you provide once a
          decision is made.
        </p>
      </div>

      <OrgProposalForm />
    </div>
  );
}
