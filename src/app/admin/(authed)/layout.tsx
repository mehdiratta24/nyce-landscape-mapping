import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/supabase/auth";
import { signOutAction } from "../_actions";

export const dynamic = "force-dynamic";

export default async function AuthedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session.user) redirect("/admin/login");

  if (!session.isAdmin) {
    return (
      <div className="max-w-md mx-auto px-6 py-20">
        <p className="text-[11px] uppercase tracking-[0.22em] text-nyce-muted mb-3 font-semibold">
          Access denied
        </p>
        <h1 className="font-display font-bold text-2xl text-nyce-ink tracking-[-0.02em] mb-3">
          This account isn't on the admin list.
        </h1>
        <p className="text-sm text-nyce-slate leading-relaxed mb-6">
          You're signed in as <strong className="text-nyce-ink">{session.user.email}</strong>,
          but this address isn't listed in <code className="font-mono text-xs">public.admin_users</code>.
          Ask another admin to add it, then sign in again.
        </p>
        <form action={signOutAction}>
          <button
            type="submit"
            className="text-sm text-nyce-accent hover:text-nyce-accentDark font-semibold underline underline-offset-2"
          >
            Sign out
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex items-end justify-between mb-10 flex-wrap gap-4 border-b border-nyce-line pb-6">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-nyce-accent mb-2 font-semibold">
            Admin
          </p>
          <nav className="flex flex-wrap items-center gap-1">
            <AdminLink href="/admin">Dashboard</AdminLink>
            <AdminLink href="/admin/queue">Review queue</AdminLink>
            <AdminLink href="/admin/bulk-upload">Bulk upload</AdminLink>
          </nav>
        </div>
        {!session.authBypassed && (
          <div className="text-xs text-nyce-muted flex items-center gap-3">
            <span>
              Signed in as <strong className="text-nyce-ink">{session.user.email}</strong>
            </span>
            <form action={signOutAction}>
              <button
                type="submit"
                className="text-nyce-accent hover:text-nyce-accentDark font-semibold underline underline-offset-2"
              >
                Sign out
              </button>
            </form>
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

function AdminLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-3 py-1.5 text-sm text-nyce-slate hover:text-nyce-accent hover:bg-nyce-accentSoft rounded-md font-medium transition-colors"
    >
      {children}
    </Link>
  );
}
