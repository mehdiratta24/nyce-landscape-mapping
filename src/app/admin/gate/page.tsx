import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const COOKIE = "admin_pw";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

async function unlock(formData: FormData) {
  "use server";
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/admin") || "/admin";
  const expected = process.env.ADMIN_PASSWORD || "NYCE2026!";
  if (password !== expected) {
    redirect(`/admin/gate?error=1&next=${encodeURIComponent(next)}`);
  }
  cookies().set(COOKIE, password, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE,
    path: "/",
  });
  redirect(next);
}

export default function AdminGatePage({
  searchParams,
}: {
  searchParams: { error?: string; next?: string };
}) {
  const next = searchParams.next ?? "/admin";
  const wasError = searchParams.error === "1";
  return (
    <div className="max-w-md mx-auto px-6 py-24">
      <p className="text-[11px] uppercase tracking-[0.22em] text-nyce-accent mb-3 font-semibold">
        Admin
      </p>
      <h1 className="font-display font-bold text-3xl md:text-4xl text-nyce-ink tracking-[-0.02em]">
        Enter admin password
      </h1>
      <p className="mt-4 text-sm text-nyce-slate leading-relaxed">
        The admin surface — review queue, bulk upload, dashboard — is gated separately
        from the rest of the site.
      </p>

      <form action={unlock} className="mt-8 space-y-4">
        <input type="hidden" name="next" value={next} />
        <label className="block">
          <span className="text-[11px] uppercase tracking-[0.18em] text-nyce-muted font-semibold">
            Admin password
          </span>
          <input
            type="password"
            name="password"
            required
            autoFocus
            placeholder="••••••••"
            className="mt-1.5 w-full rounded-md border border-nyce-line bg-white px-3 py-2.5 text-sm text-nyce-ink placeholder:text-nyce-muted/60 focus:outline-none focus:border-nyce-accent focus:ring-2 focus:ring-nyce-accent/20"
          />
        </label>
        {wasError && (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            Wrong password. Try again.
          </p>
        )}
        <button
          type="submit"
          className="w-full rounded-full bg-nyce-accent text-white py-3 text-sm font-semibold hover:bg-nyce-accentDark transition-colors"
        >
          Enter admin
        </button>
      </form>
    </div>
  );
}
