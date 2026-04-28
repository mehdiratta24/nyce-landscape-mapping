import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const supabase = createSupabaseServerClient();

  const [{ count: pending }, { count: total }, { count: deprioritized }] = await Promise.all([
    supabase.from("edit_proposals").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("organizations").select("id", { count: "exact", head: true }),
    supabase
      .from("organizations")
      .select("id", { count: "exact", head: true })
      .eq("engagement_status", "deprioritized"),
  ]);

  return (
    <div className="space-y-10">
      <div className="grid md:grid-cols-3 gap-px bg-nyce-line border border-nyce-line rounded-xl overflow-hidden">
        <Card label="Pending proposals" value={pending ?? 0} accent />
        <Card label="Organizations indexed" value={total ?? 0} />
        <Card label="Deprioritized (admin-only)" value={deprioritized ?? 0} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <ActionCard
          href="/admin/queue"
          title="Review queue"
          body="Open proposals from the public — approve, reject, or annotate."
        />
        <ActionCard
          href="/admin/bulk-upload"
          title="Bulk upload"
          body="Upload a CSV. Diff is previewed before commit; commits are all-or-nothing."
        />
      </div>
    </div>
  );
}

function Card({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="bg-white px-6 py-7">
      <div
        className={`font-display font-bold text-4xl tabular-nums leading-none ${
          accent ? "text-nyce-accent" : "text-nyce-ink"
        }`}
      >
        {value}
      </div>
      <div className="text-[11px] uppercase tracking-wider text-nyce-muted mt-2">{label}</div>
    </div>
  );
}

function ActionCard({ href, title, body }: { href: string; title: string; body: string }) {
  return (
    <Link
      href={href}
      className="group block rounded-2xl border border-nyce-line bg-white p-6 hover:border-nyce-accent/50 hover:-translate-y-0.5 hover:shadow-md hover:shadow-nyce-accent/5 transition-all"
    >
      <h2 className="font-display font-semibold text-xl text-nyce-ink tracking-[-0.01em]">{title}</h2>
      <p className="mt-2 text-sm text-nyce-slate leading-relaxed">{body}</p>
      <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-nyce-accent uppercase tracking-wider">
        Open <span className="transition-transform group-hover:translate-x-1">→</span>
      </span>
    </Link>
  );
}
