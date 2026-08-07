import { cn } from "@/lib/utils";

export type LessonObjectiveProps = {
  /**
   * One measurable behaviour, one verb (01 §5.2). Either already phrased as a
   * full sentence ("Setelah pelajaran ini Anda bisa menghitung…") or as the bare
   * verb phrase from the RINGKASAN CEPAT `TUJUAN` row ("Menghitung ukuran layar
   * minimum dari jarak duduk terjauh") — both render identically.
   */
  text: string;
  /** Prepended when `text` is a bare verb phrase. */
  prefix?: string;
  /** Mono eyebrow. Pass `null` to drop it inside an already-labelled block. */
  label?: string | null;
  id?: string;
  className?: string;
};

const DEFAULT_PREFIX = "Setelah pelajaran ini Anda bisa";

/** Bahasa Indonesia sentences start lowercase after a clause opener. */
function lowerFirst(value: string): string {
  const first = value.charAt(0);
  // Preserve acronyms and spec tokens — "RKS", "RT60", "DISCAS" must not become "rKS".
  if (first !== first.toLowerCase() && value.slice(0, 2) === value.slice(0, 2).toUpperCase()) {
    return value;
  }
  return first.toLowerCase() + value.slice(1);
}

/**
 * TUJUAN — the one-line contract a lesson makes with its reader (01 §5.2).
 *
 * The editorial rule this component exists to make visible: the verb must be
 * observable. `menghitung`, `menentukan`, `memilih`, `membedakan`, `memeriksa`,
 * `menspesifikasikan`, `mengukur`, `mendiagnosis` are permitted; `memahami`,
 * `mengetahui`, `mengenal`, `mempelajari` are banned, because an unobservable
 * verb gives the lesson no defined endpoint. The component cannot enforce that —
 * it renders whatever the author wrote — but putting the objective directly under
 * the H1, in the reader's first screen, is what makes a bad one obvious in review.
 *
 * Static, server-rendered, zero interactivity. Two objectives means two lessons.
 */
export function LessonObjective({
  text,
  prefix = DEFAULT_PREFIX,
  label = "TUJUAN",
  id,
  className,
}: LessonObjectiveProps) {
  const trimmed = text.trim().replace(/\s+/g, " ");
  if (!trimmed) return null;

  const alreadyASentence = /^setelah\b/i.test(trimmed);
  const stripped = trimmed.replace(/[.]+$/, "");
  const sentence = alreadyASentence ? `${stripped}.` : `${prefix} ${lowerFirst(stripped)}.`;

  return (
    <div id={id} className={cn("border-l-2 border-primary pl-4", className)}>
      {label ? <p className="mono-label text-muted-foreground">{label}</p> : null}
      <p className={cn("body-md text-foreground", label && "mt-1.5")}>{sentence}</p>
    </div>
  );
}
