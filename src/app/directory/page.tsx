import { Suspense } from "react";
import { getAllOrganizations } from "@/lib/data";
import { DirectoryView } from "@/components/DirectoryView";

export const dynamic = "force-static";

export default function DirectoryPage() {
  const orgs = getAllOrganizations();
  return (
    <Suspense
      fallback={<div className="max-w-7xl mx-auto px-6 py-8 text-nyce-muted">Loading…</div>}
    >
      <DirectoryView orgs={orgs} />
    </Suspense>
  );
}
