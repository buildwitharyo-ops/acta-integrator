import "server-only";

// Page through PostgREST's max_rows cap (config.toml max_rows=1000) so full-table admin reads
// (counts, reverse-lookups) stay exact on realistic datasets. Pass a builder that applies .range().
export async function fetchAllRows<T>(run: (from: number, to: number) => PromiseLike<{ data: T[] | null }>): Promise<T[]> {
  const PAGE = 1000;
  const out: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data } = await run(from, from + PAGE - 1);
    if (!data || data.length === 0) break;
    out.push(...data);
    if (data.length < PAGE) break;
  }
  return out;
}
