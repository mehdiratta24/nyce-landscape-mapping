"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  CAPABILITIES,
  DATASET_DOMAINS,
  ORGANIZATION_TYPES,
  SECTORS,
} from "@/lib/constants";
import type {
  Capability,
  DatasetDomain,
  OrganizationType,
  Sector,
} from "@/lib/types";

const VALID_SECTORS = new Set<Sector>(SECTORS.map((s) => s.value));
const VALID_TYPES = new Set<OrganizationType>(ORGANIZATION_TYPES.map((t) => t.value));
const VALID_CAPS = new Set<Capability>(CAPABILITIES);
const VALID_DOMAINS = new Set<DatasetDomain>(DATASET_DOMAINS);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ProposalResult {
  ok: boolean;
  error?: string;
  proposalId?: string;
}

export async function submitProposalAction(formData: FormData): Promise<ProposalResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      error:
        "Supabase isn't configured yet. Edit proposals will start working once the NYCE team finishes provisioning.",
    };
  }

  const target_org_id = (formData.get("target_org_id") as string | null) || null;
  const proposer_email = ((formData.get("proposer_email") as string) || "").trim().toLowerCase();
  const rationale = ((formData.get("rationale") as string) || "").trim() || null;

  if (!EMAIL_RE.test(proposer_email)) {
    return { ok: false, error: "A valid email address is required." };
  }

  const name = ((formData.get("name") as string) || "").trim();
  if (!name) return { ok: false, error: "Organization name is required." };

  const sector = formData.get("sector") as Sector;
  if (!VALID_SECTORS.has(sector)) {
    return { ok: false, error: "Please select a valid sector." };
  }

  const organization_type =
    (formData.get("organization_type") as OrganizationType) || "independent";
  if (!VALID_TYPES.has(organization_type)) {
    return { ok: false, error: "Please select a valid organization type." };
  }

  const capabilities = (formData.getAll("capabilities") as string[]).filter((c) =>
    VALID_CAPS.has(c as Capability),
  );
  const dataset_domains = (formData.getAll("dataset_domains") as string[]).filter((d) =>
    VALID_DOMAINS.has(d as DatasetDomain),
  );

  const datasets_of_focus = ((formData.get("datasets_of_focus") as string) || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const payload = {
    name,
    url: ((formData.get("url") as string) || "").trim(),
    description: ((formData.get("description") as string) || "").trim(),
    sector,
    organization_type,
    capabilities,
    dataset_domains,
    datasets_of_focus,
    contact_name: ((formData.get("contact_name") as string) || "").trim() || null,
    contact_email: ((formData.get("contact_email") as string) || "").trim() || null,
  };

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.rpc("submit_proposal", {
    p_target_org_id: target_org_id,
    p_proposed_payload: payload,
    p_proposer_email: proposer_email,
    p_rationale: rationale,
  });

  if (error) {
    console.error("[submitProposal] rpc error:", error.message);
    return { ok: false, error: "Could not save proposal. Please try again." };
  }

  return { ok: true, proposalId: data as string };
}

// ──────────────────────────────────────────────────────────────────
// Admin: approve / reject
// ──────────────────────────────────────────────────────────────────

export async function approveProposalAction(
  proposalId: string,
  adminNote?: string,
): Promise<ProposalResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase not configured." };
  const supabase = createSupabaseServerClient();

  const { data: proposal, error: fetchErr } = await supabase
    .from("edit_proposals")
    .select("*")
    .eq("id", proposalId)
    .single();
  if (fetchErr || !proposal) {
    return { ok: false, error: "Proposal not found." };
  }
  if (proposal.status !== "pending") {
    return { ok: false, error: `Proposal is already ${proposal.status}.` };
  }

  const payload = proposal.proposed_payload as Record<string, unknown>;

  if (proposal.target_org_id) {
    // Edit: apply diff to existing org
    const { error: updateErr } = await supabase
      .from("organizations")
      .update({
        name: payload.name,
        url: payload.url,
        description: payload.description,
        sector: payload.sector,
        organization_type: payload.organization_type,
        capabilities: payload.capabilities,
        dataset_domains: payload.dataset_domains,
        datasets_of_focus: payload.datasets_of_focus,
        contact_name: payload.contact_name,
        contact_email: payload.contact_email,
      })
      .eq("id", proposal.target_org_id);
    if (updateErr) {
      return { ok: false, error: `Failed to apply edit: ${updateErr.message}` };
    }
  } else {
    // New org: insert. Generate a numeric-ish id.
    const { data: maxRow } = await supabase
      .from("organizations")
      .select("id")
      .order("id", { ascending: false })
      .limit(50);
    const numericIds = (maxRow ?? [])
      .map((r) => Number(r.id))
      .filter((n) => Number.isFinite(n));
    const nextId = String((numericIds.length ? Math.max(...numericIds) : 100) + 1);

    const { error: insertErr } = await supabase.from("organizations").insert({
      id: nextId,
      name: payload.name,
      url: payload.url,
      description: payload.description,
      sector: payload.sector,
      organization_type: payload.organization_type,
      capabilities: payload.capabilities,
      dataset_domains: payload.dataset_domains,
      datasets_of_focus: payload.datasets_of_focus,
      contact_name: payload.contact_name,
      contact_email: payload.contact_email,
      engagement_status: "in_contact",
      is_verified: false,
    });
    if (insertErr) {
      return { ok: false, error: `Failed to create org: ${insertErr.message}` };
    }
  }

  const { error: markErr } = await supabase
    .from("edit_proposals")
    .update({
      status: "approved",
      admin_note: adminNote ?? null,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", proposalId);
  if (markErr) {
    return { ok: false, error: `Applied changes but failed to mark proposal: ${markErr.message}` };
  }

  revalidatePath("/admin/queue");
  revalidatePath("/directory");
  if (proposal.target_org_id) revalidatePath(`/directory/${proposal.target_org_id}`);
  return { ok: true };
}

export async function rejectProposalAction(
  proposalId: string,
  adminNote: string,
): Promise<ProposalResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase not configured." };
  if (!adminNote.trim()) return { ok: false, error: "Reason for rejection is required." };
  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("edit_proposals")
    .update({
      status: "rejected",
      admin_note: adminNote.trim(),
      resolved_at: new Date().toISOString(),
    })
    .eq("id", proposalId)
    .eq("status", "pending");
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/queue");
  return { ok: true };
}
