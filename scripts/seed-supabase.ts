/**
 * One-shot: push data/organizations.json into Supabase.
 *
 * Prereqs:
 *   1. Apply supabase/migrations/0001_init.sql via Supabase dashboard → SQL editor.
 *   2. Set in .env.local:
 *        NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
 *        SUPABASE_SERVICE_ROLE_KEY=<from Project Settings → API>
 *      The service role key is used here so seeding bypasses RLS. Do NOT use the
 *      anon key for this script and do NOT commit the service role key to git.
 *
 * Run:  npm run seed:supabase
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import type { Organization } from "../src/lib/types";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

dotenv.config({ path: path.join(ROOT, ".env.local") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Missing env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false },
});

async function main() {
  const orgs = JSON.parse(
    fs.readFileSync(path.join(ROOT, "data", "organizations.json"), "utf8"),
  ) as Organization[];

  console.log(`Pushing ${orgs.length} organizations…`);

  const rows = orgs.map((o) => ({
    id: o.id,
    name: o.name,
    url: o.url,
    description: o.description,
    sectors: o.sectors,
    organization_type: o.organization_type,
    engagement_status: o.engagement_status,
    capabilities: o.capabilities,
    dataset_domains: o.dataset_domains,
    partners: o.partners,
    datasets_of_focus: o.datasets_of_focus,
    contact_name: o.contact_name,
    contact_email: o.contact_email,
    logo_url: o.logo_url,
    is_verified: o.is_verified,
    created_at: o.created_at,
    last_updated: o.last_updated,
  }));

  // Upsert in chunks to keep payload size sane.
  const chunkSize = 50;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const slice = rows.slice(i, i + chunkSize);
    const { error } = await supabase.from("organizations").upsert(slice, {
      onConflict: "id",
    });
    if (error) {
      console.error(`Chunk ${i}-${i + slice.length} failed:`, error.message);
      process.exit(1);
    }
    console.log(`  ✓ pushed ${i + slice.length}/${rows.length}`);
  }

  // Sanity check
  const { count } = await supabase
    .from("organizations")
    .select("id", { count: "exact", head: true });
  console.log(`Done. Table now contains ${count} organizations.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
