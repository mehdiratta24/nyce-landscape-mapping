import { createSupabaseAdminClient } from "@/lib/supabase/admin-server";
import { BulkUploader } from "./BulkUploader";
import type { Organization } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function BulkUploadPage() {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase.from("organizations").select("*");
  const orgs = (data ?? []) as unknown as Organization[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-3xl text-nyce-ink tracking-[-0.02em]">
          Bulk upload
        </h1>
        <p className="mt-2 text-sm text-nyce-slate max-w-2xl leading-relaxed">
          Upload a CSV matching the directory schema. Rows are matched by
          <code className="font-mono text-xs"> id </code>
          if present, else by case-insensitive
          <code className="font-mono text-xs"> name </code>. The diff preview shows what will be
          added vs. updated; you confirm before any writes happen.
        </p>
      </div>

      <BulkUploader existing={orgs} />
    </div>
  );
}
