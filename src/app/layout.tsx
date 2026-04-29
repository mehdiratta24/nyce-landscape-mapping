import type { Metadata } from "next";
import Link from "next/link";
import { Onest, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { getSession } from "@/lib/supabase/auth";

const onest = Onest({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Climate Data Landscape — The New York Climate Exchange",
  description:
    "A shared map of organizations preserving, rescuing, and stewarding public climate and environmental data. An initiative of The New York Climate Exchange.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession();
  return (
    <html lang="en" className={`${onest.variable} ${mono.variable}`}>
      <body className="antialiased min-h-screen flex flex-col font-sans text-nyce-ink">
        <header className="sticky top-0 z-30 border-b border-nyce-line/70 bg-nyce-paper/90 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-3">
              <Wordmark />
            </Link>
            <nav className="flex items-center gap-1 text-sm font-medium">
              <NavLink href="/directory">Directory</NavLink>
              <NavLink href="/resources">Resources</NavLink>
              <a
                href="https://www.nyclimateexchange.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-nyce-accent text-white hover:bg-nyce-accentDark transition-colors"
              >
                NYCE
                <span aria-hidden className="text-xs">↗</span>
              </a>
            </nav>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-nyce-line mt-24 bg-white">
          <div className="max-w-7xl mx-auto px-6 py-12 grid md:grid-cols-2 gap-8">
            <div>
              <Wordmark />
              <p className="text-sm text-nyce-muted mt-4 max-w-md leading-relaxed">
                This directory is maintained by The New York Climate Exchange as part of the
                Climate Data Stewardship initiative. Source records and classifications are
                documented internally; proposed revisions enter a moderated review queue.
              </p>
            </div>
            <div className="md:text-right text-xs text-nyce-muted space-y-2">
              <p className="uppercase tracking-[0.2em] font-semibold">
                Working document · v0.1 · read-only
              </p>
              <p>
                <a
                  className="underline underline-offset-2 hover:text-nyce-accent"
                  href="https://www.nyclimateexchange.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  nyclimateexchange.org
                </a>
              </p>
              <p>
                <Link
                  href={session.isAdmin ? "/admin" : "/admin/login"}
                  className="text-nyce-muted hover:text-nyce-accent underline underline-offset-2"
                >
                  {session.isAdmin ? "Admin dashboard" : "Admin sign-in"}
                </Link>
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-3 py-2 rounded-md text-nyce-slate hover:text-nyce-ink hover:bg-nyce-accentSoft/50 transition-colors"
    >
      {children}
    </Link>
  );
}

function Wordmark() {
  return (
    <span className="inline-flex items-baseline gap-2.5 text-nyce-ink">
      <span className="relative inline-flex items-center gap-1.5" aria-hidden>
        <span className="h-2 w-2 rounded-full bg-nyce-yellow" />
        <span className="h-2 w-2 rounded-full bg-nyce-accent" />
        <span className="h-2 w-2 rounded-full bg-nyce-aqua" />
      </span>
      <span className="font-semibold tracking-tight text-[15px] leading-none">
        Climate Data Landscape
      </span>
    </span>
  );
}
