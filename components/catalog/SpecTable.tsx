type SpecValue = {
  key: string | null;
  label: string | null;
  spec_group: string | null;
  data_type: string | null;
  unit: string | null;
  sort_order: number | null;
  value_text: string | null;
  value_number: number | null;
  value_boolean: boolean | null;
  value_options: string[] | null;
};

function formatValue(s: SpecValue): string {
  if (s.data_type === "boolean") return s.value_boolean == null ? "—" : s.value_boolean ? "Ya" : "Tidak";
  if (s.data_type === "enum") {
    const opts = (s.value_options ?? []).filter(Boolean);
    return opts.length ? opts.join(", ") : s.value_text ?? "—";
  }
  if (s.data_type === "number") {
    const base = s.value_text ?? (s.value_number != null ? String(s.value_number) : "");
    return `${base}${s.unit ? ` ${s.unit}` : ""}`.trim() || "—";
  }
  return s.value_text ?? "—";
}

export function SpecTable({
  specs,
  brandName,
  sourceUrl,
}: {
  specs: SpecValue[];
  brandName?: string | null;
  sourceUrl?: string | null;
}) {
  if (!specs.length) return null;

  const sorted = [...specs].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const order: string[] = [];
  const groups: Record<string, SpecValue[]> = {};
  for (const s of sorted) {
    const g = s.spec_group ?? "Spesifikasi";
    if (!groups[g]) {
      groups[g] = [];
      order.push(g);
    }
    groups[g].push(s);
  }

  return (
    <section>
      <h2 className="display-md">Spesifikasi</h2>
      <div className="mt-6 overflow-x-auto rounded-lg border border-border">
        <table className="w-full border-collapse text-left">
          {order.map((group) => (
            <tbody key={group}>
              <tr>
                <th
                  colSpan={2}
                  className="mono-label border-b border-border bg-muted/60 px-4 py-2.5 text-muted-foreground"
                >
                  {group}
                </th>
              </tr>
              {groups[group]!.map((row, i) => (
                <tr key={row.key ?? i} className={i % 2 === 1 ? "bg-muted/25" : undefined}>
                  <td className="body-sm w-1/2 px-4 py-2.5 align-top text-muted-foreground">{row.label}</td>
                  <td className="mono-spec px-4 py-2.5 align-top text-foreground">{formatValue(row)}</td>
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>
      {sourceUrl ? (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener nofollow"
          className="mono-label mt-3 inline-block text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          Sumber: spec resmi {brandName ?? "brand"} ↗
        </a>
      ) : null}
    </section>
  );
}
