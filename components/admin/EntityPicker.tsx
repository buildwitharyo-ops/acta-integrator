"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";

export type PickerOption = { id: string; label: string; sublabel?: string };

export function EntityPicker({
  options,
  value,
  onChange,
  placeholder = "Cari untuk menambah…",
  max,
}: {
  options: PickerOption[];
  value: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
  max?: number;
}) {
  const [query, setQuery] = useState("");
  const byId = useMemo(() => new Map(options.map((o) => [o.id, o])), [options]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return options
      .filter((o) => !value.includes(o.id) && `${o.label} ${o.sublabel ?? ""}`.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, options, value]);

  const atMax = max != null && value.length >= max;

  const add = (id: string) => {
    if (atMax || value.includes(id)) return;
    onChange([...value, id]);
    setQuery("");
  };
  const remove = (id: string) => onChange(value.filter((v) => v !== id));
  const move = (i: number, dir: -1 | 1) => {
    const next = [...value];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j]!, next[i]!];
    onChange(next);
  };

  return (
    <div>
      {value.length > 0 ? (
        <ul className="mb-2 space-y-1.5">
          {value.map((id, i) => {
            const opt = byId.get(id);
            return (
              <li key={id} className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm">
                <span className="w-5 text-center text-xs text-muted-foreground">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate">
                  {opt?.label ?? id}
                  {opt?.sublabel ? <span className="ml-1.5 text-xs text-muted-foreground">{opt.sublabel}</span> : null}
                </span>
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="text-muted-foreground disabled:opacity-30 hover:text-foreground">
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === value.length - 1} className="text-muted-foreground disabled:opacity-30 hover:text-foreground">
                  <ChevronDown className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => remove(id)} className="text-muted-foreground hover:text-destructive">
                  <X className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {atMax ? (
        <p className="text-xs text-muted-foreground">Maksimal {max} item.</p>
      ) : (
        <div className="relative">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          {matches.length > 0 ? (
            <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-border bg-popover shadow-md">
              {matches.map((o) => (
                <li key={o.id}>
                  <button
                    type="button"
                    onClick={() => add(o.id)}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                  >
                    <span>{o.label}</span>
                    {o.sublabel ? <span className="text-xs text-muted-foreground">{o.sublabel}</span> : null}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )}
    </div>
  );
}
