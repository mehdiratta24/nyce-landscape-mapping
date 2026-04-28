"use client";

import { Suspense, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const params = useSearchParams();
  const next = params.get("next") || "/admin";
  const [email, setEmail] = useState("");
  const [pending, startTransition] = useTransition();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const supabase = createSupabaseBrowserClient();
    startTransition(async () => {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/admin/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (error) setError(error.message);
      else setSentTo(email);
    });
  }

  return (
    <div className="max-w-md mx-auto px-6 py-20">
      <p className="text-[11px] uppercase tracking-[0.22em] text-nyce-muted mb-3 font-semibold">
        Admin
      </p>
      <h1 className="font-display font-bold text-3xl text-nyce-ink tracking-[-0.02em] mb-3">
        Sign in
      </h1>
      <p className="text-sm text-nyce-slate leading-relaxed mb-8">
        NYCE administrators receive a one-time link by email. Only addresses listed in the
        admin allow-list are granted access.
      </p>

      {sentTo ? (
        <div className="rounded-2xl border border-nyce-line bg-white p-6">
          <p className="font-display text-lg text-nyce-ink mb-2">Check your inbox.</p>
          <p className="text-sm text-nyce-slate leading-relaxed">
            We sent a sign-in link to <strong className="text-nyce-ink">{sentTo}</strong>. Open
            the link on this device to continue. The link expires in one hour.
          </p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block">
            <span className="text-[11px] uppercase tracking-[0.18em] text-nyce-muted font-semibold">
              Email
            </span>
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-nyce-line bg-white px-3 py-2.5 text-sm text-nyce-ink placeholder:text-nyce-muted/70 focus:outline-none focus:border-nyce-accent focus:ring-2 focus:ring-nyce-accent/20"
              placeholder="you@nyclimateexchange.org"
            />
          </label>
          {error && (
            <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-full bg-nyce-accent text-white py-3 text-sm font-semibold hover:bg-nyce-accentDark transition-colors disabled:opacity-60"
          >
            {pending ? "Sending…" : "Email me a sign-in link"}
          </button>
        </form>
      )}
    </div>
  );
}
