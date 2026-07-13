import Link from "next/link";

const pad = (n: number) => String(n).padStart(2, "0");

export function Pagination({
  page,
  totalPages,
  makeHref,
}: {
  page: number;
  totalPages: number;
  makeHref: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  const pill = "inline-flex h-10 items-center rounded-pill px-5 text-sm ring-1 ring-inset ring-border transition-colors hover:bg-card";

  return (
    <div className="mt-12 flex items-center justify-between">
      {page > 1 ? (
        <Link href={makeHref(page - 1)} className={pill}>
          ← Sebelumnya
        </Link>
      ) : (
        <span />
      )}
      <span className="mono-spec text-muted-foreground">
        {pad(page)} / {pad(totalPages)}
      </span>
      {page < totalPages ? (
        <Link href={makeHref(page + 1)} className={pill}>
          Berikutnya →
        </Link>
      ) : (
        <span />
      )}
    </div>
  );
}
