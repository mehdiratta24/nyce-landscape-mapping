import fs from "node:fs";
import path from "node:path";
import { hostFromUrl } from "@/lib/utils";

interface ResourceLink {
  label: string;
  url: string;
  note?: string;
}
interface ResourceGroup {
  group: string;
  links: ResourceLink[];
}

function loadResources(): ResourceGroup[] {
  const p = path.join(process.cwd(), "data", "resources.json");
  return JSON.parse(fs.readFileSync(p, "utf8")) as ResourceGroup[];
}

export default function ResourcesPage() {
  const groups = loadResources();
  const total = groups.reduce((n, g) => n + g.links.length, 0);

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-nyce-muted mb-3 font-semibold">
            Appendix B
          </p>
          <h1 className="font-display font-bold text-3xl md:text-4xl text-nyce-ink tracking-[-0.02em]">
            Reference resources
          </h1>
          <p className="mt-3 text-nyce-slate max-w-2xl text-sm leading-relaxed">
            External resources referenced in the construction and maintenance of this directory,
            grouped by function. Links are maintained by the NYCE admin team and updated as the
            reference set evolves.
          </p>
        </div>
        <div className="text-right">
          <div className="font-display font-bold text-3xl text-nyce-accent tabular-nums leading-none">
            {total}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-nyce-muted mt-1">entries</div>
        </div>
      </div>

      <div className="space-y-12">
        {groups.map((g, i) => (
          <section key={g.group}>
            <div className="flex items-baseline gap-3 mb-4">
              <span className="font-mono text-xs text-nyce-accent tabular-nums font-semibold">
                B.{i + 1}
              </span>
              <h2 className="font-display font-bold text-xl text-nyce-ink tracking-[-0.02em]">
                {g.group}
              </h2>
              <span className="text-xs text-nyce-muted tabular-nums">n = {g.links.length}</span>
            </div>
            <ul className="divide-y divide-nyce-line border border-nyce-line rounded-2xl bg-white overflow-hidden">
              {g.links.map((link) => (
                <li key={link.url}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start gap-4 p-5 hover:bg-nyce-paper transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-3 flex-wrap">
                        <span className="font-display font-semibold text-base text-nyce-ink group-hover:text-nyce-accent transition-colors">
                          {link.label}
                        </span>
                        <span className="text-xs text-nyce-muted font-mono">
                          {hostFromUrl(link.url)}
                        </span>
                      </div>
                      {link.note && (
                        <p className="mt-1.5 text-sm text-nyce-slate leading-relaxed">
                          {link.note}
                        </p>
                      )}
                    </div>
                    <span
                      className="text-nyce-muted group-hover:text-nyce-accent transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                      aria-hidden
                    >
                      ↗
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
