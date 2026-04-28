import { Suspense } from "react";
import { getAllOrganizations } from "@/lib/data";
import { DirectoryView } from "@/components/DirectoryView";
import { getSession } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

export default async function DirectoryPage() {
  const [orgs, session] = await Promise.all([
    getAllOrganizations({ includeAll: false }),
    getSession(),
  ]);
  return (
    <Suspense
      fallback={<div className="max-w-7xl mx-auto px-6 py-8 text-nyce-muted">Loading…</div>}
    >
      <DirectoryView orgs={orgs} isAdmin={session.isAdmin} />
    </Suspense>
  );
}
