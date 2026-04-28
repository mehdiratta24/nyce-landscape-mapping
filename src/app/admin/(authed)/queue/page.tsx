import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ProposalRow } from "./ProposalRow";

export const dynamic = "force-dynamic";

interface ProposalRecord {
  id: string;
  target_org_id: string | null;
  proposed_payload: Record<string, unknown>;
  proposer_email: string;
  rationale: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

interface OrgRecord {
  id: string;
  name: string;
  url: string | null;
  description: string | null;
  sector: string;
  organization_type: string;
  capabilities: string[];
  dataset_domains: string[];
  contact_name: string | null;
  contact_email: string | null;
}

export default async function ReviewQueue({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const supabase = createSupabaseServerClient();
  const status = (searchParams.status as ProposalRecord["status"]) || "pending";

  const { data: proposals } = await supabase
    .from("edit_proposals")
    .select("*")
    .eq("status", status)
    .order("created_at", { ascending: false });

  const targetIds = (proposals ?? [])
    .map((p) => p.target_org_id)
    .filter((x): x is string => Boolean(x));

  const { data: targets } = targetIds.length
    ? await supabase
        .from("organizations")
        .select("id, name, url, description, sector, organization_type, capabilities, dataset_domains, contact_name, contact_email")
        .in("id", targetIds)
    : { data: [] };

  const targetById = new Map<string, OrgRecord>(
    (targets ?? []).map((t) => [t.id, t as OrgRecord]),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display font-bold text-3xl text-nyce-ink tracking-[-0.02em]">
            Review queue
          </h1>
          <p className="mt-2 text-sm text-nyce-slate max-w-xl leading-relaxed">
            Proposals submitted through the public form. Approving an edit applies the diff to
            the target organization; approving a new-org proposal creates a record in
            <code className="font-mono text-xs"> in_contact </code>
            engagement state.
          </p>
        </div>
        <StatusTabs current={status} />
      </div>

      {(proposals ?? []).length === 0 ? (
        <div className="rounded-2xl border border-dashed border-nyce-line p-16 text-center bg-white">
          <p className="font-display text-lg text-nyce-ink">
            No {status} proposals.
          </p>
          {status === "pending" && (
            <p className="text-sm text-nyce-muted mt-2">
              When the public submits a proposal, it'll show up here.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {(proposals ?? []).map((p) => (
            <ProposalRow
              key={p.id}
              proposal={p as ProposalRecord}
              currentOrg={p.target_org_id ? targetById.get(p.target_org_id) ?? null : null}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StatusTabs({ current }: { current: string }) {
  const tabs = [
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
  ];
  return (
    <div className="flex rounded-full border border-nyce-line bg-white p-0.5 text-sm">
      {tabs.map((t) => (
        <a
          key={t.value}
          href={`/admin/queue?status=${t.value}`}
          className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
            current === t.value
              ? "bg-nyce-accent text-white"
              : "text-nyce-muted hover:text-nyce-ink"
          }`}
        >
          {t.label}
        </a>
      ))}
    </div>
  );
}
