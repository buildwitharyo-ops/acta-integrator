"use client";

import { Checkbox } from "@/components/ui/checkbox";
import type { Bucket, FilterState } from "@/lib/catalog";
import { cn } from "@/lib/utils";

export type SpecFacet = {
  key: string;
  label: string;
  kind: "number" | "enum" | "boolean";
  buckets: Bucket[];
  options: string[];
};

type Props = {
  categories: { slug: string; name: string }[];
  brandFacets: { slug: string; name: string; count: number }[];
  solutionFacets: { slug: string; name: string }[];
  specFacets: SpecFacet[];
  state: FilterState;
  forcedCategory?: string;
  onCategory: (slug: string | null) => void;
  onToggleBrand: (slug: string) => void;
  onToggleSolution: (slug: string) => void;
  onToggleSpec: (key: string, token: string) => void;
};

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-border py-5 first:border-t-0 first:pt-0">
      <p className="mono-label mb-3 text-foreground">{title}</p>
      {children}
    </div>
  );
}

function Row({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: () => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
      <Checkbox checked={checked} onChange={onChange} />
      <span className="min-w-0 flex-1">{children}</span>
    </label>
  );
}

export function FilterSidebar({
  categories,
  brandFacets,
  solutionFacets,
  specFacets,
  state,
  forcedCategory,
  onCategory,
  onToggleBrand,
  onToggleSolution,
  onToggleSpec,
}: Props) {
  return (
    <div className="flex flex-col">
      {forcedCategory ? null : (
        <Group title="Kategori">
          <div className="flex flex-col">
            <button
              type="button"
              onClick={() => onCategory(null)}
              className={cn(
                "py-1.5 text-left text-sm transition-colors",
                state.category ? "text-muted-foreground hover:text-foreground" : "font-medium text-accent-text",
              )}
            >
              Semua kategori
            </button>
            {categories.map((c) => (
              <button
                key={c.slug}
                type="button"
                onClick={() => onCategory(c.slug)}
                className={cn(
                  "py-1.5 text-left text-sm transition-colors",
                  state.category === c.slug ? "font-medium text-accent-text" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {c.name}
              </button>
            ))}
          </div>
        </Group>
      )}

      {brandFacets.length > 0 ? (
        <Group title="Brand">
          {brandFacets.map((b) => (
            <Row key={b.slug} checked={state.brands.includes(b.slug)} onChange={() => onToggleBrand(b.slug)}>
              <span className="flex items-center justify-between gap-2">
                <span>{b.name}</span>
                <span className="mono-spec text-muted-foreground/60">{b.count}</span>
              </span>
            </Row>
          ))}
        </Group>
      ) : null}

      {solutionFacets.length > 0 ? (
        <Group title="Solusi terkait">
          {solutionFacets.map((s) => (
            <Row key={s.slug} checked={state.solutions.includes(s.slug)} onChange={() => onToggleSolution(s.slug)}>
              {s.name}
            </Row>
          ))}
        </Group>
      ) : null}

      {specFacets.map((facet) => (
        <Group key={facet.key} title={facet.label}>
          {facet.kind === "boolean" ? (
            <Row
              checked={(state.specs[facet.key] ?? []).includes("true")}
              onChange={() => onToggleSpec(facet.key, "true")}
            >
              Ya
            </Row>
          ) : facet.kind === "number" ? (
            facet.buckets.map((bkt) => (
              <Row
                key={bkt.token}
                checked={(state.specs[facet.key] ?? []).includes(bkt.token)}
                onChange={() => onToggleSpec(facet.key, bkt.token)}
              >
                {bkt.label}
              </Row>
            ))
          ) : (
            facet.options.map((opt) => (
              <Row
                key={opt}
                checked={(state.specs[facet.key] ?? []).includes(opt)}
                onChange={() => onToggleSpec(facet.key, opt)}
              >
                {opt}
              </Row>
            ))
          )}
        </Group>
      ))}
    </div>
  );
}
