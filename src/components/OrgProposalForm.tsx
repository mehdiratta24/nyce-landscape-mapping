"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CAPABILITIES,
  DATASET_DOMAINS,
  ORGANIZATION_TYPES,
  SECTORS,
} from "@/lib/constants";
import type { Organization } from "@/lib/types";
import { submitProposalAction } from "@/app/directory/_actions";

interface Props {
  /** When provided, this is an edit proposal pre-filled with existing values. */
  org?: Organization;
}

export function OrgProposalForm({ org }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [proposerEmail, setProposerEmail] = useState("");

  if (submittedId) {
    return (
      <div className="rounded-2xl border border-nyce-line bg-white p-8 max-w-2xl">
        <p className="text-[11px] uppercase tracking-[0.22em] text-nyce-accent font-semibold mb-3">
          Proposal received
        </p>
        <h2 className="font-display font-bold text-2xl text-nyce-ink tracking-[-0.02em] mb-3">
          Thanks — your submission is in the review queue.
        </h2>
        <p className="text-nyce-slate text-sm leading-relaxed">
          The NYCE team will review the proposal and update the directory if approved. You'll
          hear back at <strong className="text-nyce-ink">{proposerEmail}</strong> once a decision
          is made. Reference ID: <code className="font-mono text-xs">{submittedId.slice(0, 8)}</code>.
        </p>
        <button
          onClick={() => router.push(org ? `/directory/${org.id}` : "/directory")}
          className="mt-6 inline-flex items-center gap-2 text-sm text-nyce-accent font-semibold hover:text-nyce-accentDark"
        >
          ← Back to {org ? "organization page" : "directory"}
        </button>
      </div>
    );
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const email = (fd.get("proposer_email") as string) || "";
    setProposerEmail(email);
    startTransition(async () => {
      const result = await submitProposalAction(fd);
      if (!result.ok) {
        setError(result.error ?? "Something went wrong.");
      } else if (result.proposalId) {
        setSubmittedId(result.proposalId);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid md:grid-cols-[2fr_1fr] gap-8 items-start">
      <div className="space-y-6">
        {org && <input type="hidden" name="target_org_id" value={org.id} />}

        <Field
          label="Organization name"
          required
          name="name"
          defaultValue={org?.name ?? ""}
        />
        <Field
          label="Homepage URL"
          name="url"
          type="url"
          placeholder="https://example.org"
          defaultValue={org?.url ?? ""}
        />
        <FieldLabel label="Description" required>
          <textarea
            name="description"
            required
            rows={4}
            defaultValue={org?.description ?? ""}
            className={inputClass + " resize-y"}
            placeholder="One to three sentences describing the organization's role in the climate-data ecosystem."
          />
        </FieldLabel>

        <div className="grid sm:grid-cols-2 gap-6">
          <FieldLabel label="Sector" required>
            <select
              name="sector"
              required
              defaultValue={org?.sector ?? ""}
              className={inputClass}
            >
              <option value="">Select…</option>
              {SECTORS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </FieldLabel>
          <FieldLabel label="Organization type">
            <select
              name="organization_type"
              defaultValue={org?.organization_type ?? "independent"}
              className={inputClass}
            >
              {ORGANIZATION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </FieldLabel>
        </div>

        <FieldLabel label="Capabilities">
          <CheckboxGroup
            name="capabilities"
            options={CAPABILITIES}
            defaults={org?.capabilities ?? []}
          />
        </FieldLabel>

        <FieldLabel label="Dataset domains">
          <CheckboxGroup
            name="dataset_domains"
            options={DATASET_DOMAINS}
            defaults={org?.dataset_domains ?? []}
          />
        </FieldLabel>

        <FieldLabel label="Datasets of focus" hint="Comma-separated. E.g. GHGRP, CJEST, FEMA Flood Zone.">
          <input
            type="text"
            name="datasets_of_focus"
            defaultValue={(org?.datasets_of_focus ?? []).join(", ")}
            className={inputClass}
            placeholder="GHGRP, CJEST"
          />
        </FieldLabel>

        <div className="grid sm:grid-cols-2 gap-6">
          <Field
            label="Contact name"
            name="contact_name"
            defaultValue={org?.contact_name ?? ""}
          />
          <Field
            label="Contact email"
            name="contact_email"
            type="email"
            defaultValue={org?.contact_email ?? ""}
          />
        </div>
      </div>

      <aside className="rounded-2xl border border-nyce-line bg-white p-6 sticky top-24 space-y-5">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-nyce-muted mb-3 font-semibold">
            Submit
          </p>
          <Field
            label="Your email"
            required
            name="proposer_email"
            type="email"
            placeholder="you@example.org"
            hint="Required. We'll let you know once an admin reviews this."
          />
          <FieldLabel label="Rationale" hint="Optional. Helpful context for the reviewer.">
            <textarea
              name="rationale"
              rows={3}
              className={inputClass + " resize-y mt-2"}
              placeholder="Why this change?"
            />
          </FieldLabel>
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-nyce-accent text-white py-3 text-sm font-semibold hover:bg-nyce-accentDark transition-colors disabled:opacity-60 disabled:cursor-wait"
        >
          {pending ? "Submitting…" : org ? "Submit proposed edit" : "Submit new organization"}
        </button>
        <p className="text-[11px] text-nyce-muted leading-relaxed">
          Submissions enter a review queue moderated by the NYCE team. Approved proposals update
          the directory; rejected ones are returned with a reason.
        </p>
      </aside>
    </form>
  );
}

const inputClass =
  "w-full rounded-md border border-nyce-line bg-white px-3 py-2 text-sm text-nyce-ink placeholder:text-nyce-muted/70 focus:outline-none focus:border-nyce-accent focus:ring-2 focus:ring-nyce-accent/20";

function FieldLabel({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-[0.18em] text-nyce-muted font-semibold">
        {label}
        {required && <span className="text-nyce-accent ml-1">*</span>}
      </span>
      <div className="mt-1.5">{children}</div>
      {hint && <span className="block mt-1.5 text-[11px] text-nyce-muted">{hint}</span>}
    </label>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  defaultValue,
  placeholder,
  hint,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <FieldLabel label={label} required={required} hint={hint}>
      <input
        type={type}
        name={name}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className={inputClass}
      />
    </FieldLabel>
  );
}

function CheckboxGroup({
  name,
  options,
  defaults,
}: {
  name: string;
  options: readonly string[];
  defaults: readonly string[];
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const id = `${name}-${o.replace(/\W+/g, "-")}`;
        const isDefault = defaults.includes(o);
        return (
          <label
            key={o}
            htmlFor={id}
            className="cursor-pointer text-xs px-3 py-1.5 rounded-full border border-nyce-line bg-white hover:border-nyce-accent/50 has-[:checked]:bg-nyce-ink has-[:checked]:text-white has-[:checked]:border-nyce-ink transition-colors"
          >
            <input
              id={id}
              type="checkbox"
              name={name}
              value={o}
              defaultChecked={isDefault}
              className="sr-only"
            />
            {o}
          </label>
        );
      })}
    </div>
  );
}
