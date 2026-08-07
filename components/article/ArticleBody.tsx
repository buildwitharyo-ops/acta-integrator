import { Fragment } from "react";
import Image from "next/image";
import Link from "next/link";
import { MeterDivider } from "@/components/shared/MeterDivider";
import { AnswerBlock } from "@/components/learn/body/AnswerBlock";
import { CalcEmbed, isLearnToolSlug, type CalcPreset } from "@/components/learn/body/CalcEmbed";
import { Callout, isCalloutVariant } from "@/components/learn/body/Callout";
import { ChecklistBlock } from "@/components/learn/body/ChecklistBlock";
import { ComparisonTable, type ComparisonColumn, type ComparisonRow } from "@/components/learn/body/ComparisonTable";
import { DiagramFigure, type DiagramDatum } from "@/components/learn/body/DiagramFigure";
import { GlossaryLink } from "@/components/learn/body/GlossaryLink";
import { KeyTakeaways } from "@/components/learn/body/KeyTakeaways";
import { SelfCheck, type SelfCheckItem, type SelfCheckOption } from "@/components/learn/body/SelfCheck";
import { SpecBlock, type SpecRow } from "@/components/learn/body/SpecBlock";
import { collectHeadings, isDoc, type TiptapMark, type TiptapNode } from "@/lib/article";
import { fmt } from "@/lib/learn/format";
import { cn } from "@/lib/utils";

function Inline({ nodes }: { nodes: TiptapNode[] | undefined }) {
  return (
    <>
      {(nodes ?? []).map((n, i) => {
        if (n.type === "hardBreak") return <br key={i} />;
        if (typeof n.text !== "string") return null;
        return <MarkedText key={i} text={n.text} marks={n.marks} />;
      })}
    </>
  );
}

function MarkedText({ text, marks }: { text: string; marks: TiptapMark[] | undefined }) {
  let node: React.ReactNode = text;
  for (const mark of marks ?? []) {
    if (mark.type === "bold") node = <strong className="font-semibold text-foreground">{node}</strong>;
    else if (mark.type === "italic") node = <em>{node}</em>;
    else if (mark.type === "code")
      node = <code className="mono-spec rounded bg-muted px-1.5 py-0.5 text-foreground">{node}</code>;
    else if (mark.type === "glossary") {
      // Marking a term is authoring intent; whether it LINKS is decided by
      // GlossaryLink's per-render ledger (first mention only, max 3 per lesson).
      // An author can therefore mark every mention without over-linking the page.
      const term = attrString(mark.attrs?.term) ?? text;
      node = (
        <GlossaryLink term={term} anchor={attrString(mark.attrs?.anchor)}>
          {node}
        </GlossaryLink>
      );
    } else if (mark.type === "link") {
      const href = typeof mark.attrs?.href === "string" ? mark.attrs.href : "#";
      const internal = href.startsWith("/") && !href.startsWith("//");
      node = internal ? (
        <Link href={href} className="text-accent-text underline underline-offset-2 hover:text-foreground">
          {node}
        </Link>
      ) : (
        <a
          href={href}
          target="_blank"
          rel="noopener nofollow"
          className="text-accent-text underline underline-offset-2 hover:text-foreground"
        >
          {node}
        </a>
      );
    }
  }
  return <>{node}</>;
}

/* ------------------------------------------------------------------ *
 * Learn node types (03-UI §11.3)
 *
 * The walker's `default → null` for an unknown node type is a genuine safety
 * property: a renderer lagging the editor degrades silently instead of crashing.
 * But a silent null is a VOID, and the process gate forbids voids. So **every
 * Learn node carries a required `fallback` string attr**, rendered as a plain
 * paragraph whenever the node kind is unknown or its attrs fail validation.
 * Degradation is a sentence, never a hole.
 *
 * Validation policy, applied consistently below:
 *   • a failure that makes the block UNRENDERABLE (no rows, no items, unknown
 *     tool) falls back to the sentence;
 *   • a merely cosmetic failure (an unknown callout variant, a missing title)
 *     takes a documented default, because dropping to the sentence would throw
 *     away prose that is perfectly renderable.
 *
 * Attrs arrive from JSONB, so nothing here trusts a type: every reader below
 * narrows `unknown` and returns a null/empty value rather than throwing.
 * ------------------------------------------------------------------ */

function attrString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function attrNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function attrBool(value: unknown): boolean {
  return value === true || value === "true";
}

function attrStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  for (const item of value) {
    if (typeof item === "string" && item.trim()) out.push(item.trim());
  }
  return out;
}

function attrObjectArray(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  const out: Record<string, unknown>[] = [];
  for (const item of value) {
    if (typeof item === "object" && item !== null && !Array.isArray(item)) {
      out.push(item as Record<string, unknown>);
    }
  }
  return out;
}

/** Table cells: strings pass through, numbers go through the Indonesian formatter. */
function attrCell(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return fmt(value);
  return "";
}

function FallbackParagraph({ text }: { text: string }) {
  return <p className="body-lg text-foreground/85">{text}</p>;
}

/**
 * Children of a prose container (answerBlock, callout).
 *
 * Paragraphs render as UNSTYLED `<p>` so they inherit the container's type scale
 * — a `body-lg` from the normal paragraph case would override the callout's own
 * `mono-spec` or `body-md`. Everything else falls through to `Block`, so a list
 * or a code block inside a callout still renders correctly.
 */
function ProseChildren({ nodes }: { nodes: TiptapNode[] | undefined }) {
  return (
    <>
      {(nodes ?? []).map((child, i) =>
        child.type === "paragraph" ? (
          child.content?.length ? (
            <p key={i}>
              <Inline nodes={child.content} />
            </p>
          ) : null
        ) : (
          <Block key={i} node={child} />
        ),
      )}
    </>
  );
}

function specRowsFrom(value: unknown): SpecRow[] {
  const out: SpecRow[] = [];
  for (const row of attrObjectArray(value)) {
    const label = attrString(row.label);
    const rowValue = attrString(row.value);
    if (!label || !rowValue) continue;
    out.push({ label, value: rowValue, href: attrString(row.href) });
  }
  return out;
}

function comparisonColumnsFrom(value: unknown): ComparisonColumn[] {
  const out: ComparisonColumn[] = [];
  for (const column of attrObjectArray(value)) {
    const key = attrString(column.key);
    const label = attrString(column.label);
    if (!key || !label) continue;
    out.push({
      key,
      label,
      align: column.align === "right" ? "right" : "left",
      mono: attrBool(column.mono),
      width: attrString(column.width) ?? undefined,
    });
  }
  return out;
}

function comparisonRowsFrom(value: unknown, columns: readonly ComparisonColumn[]): ComparisonRow[] {
  const out: ComparisonRow[] = [];
  for (const row of attrObjectArray(value)) {
    const cells: Record<string, string> = {};
    for (const column of columns) cells[column.key] = attrCell(row[column.key]);
    out.push(cells);
  }
  return out;
}

function selfCheckItemsFrom(value: unknown): SelfCheckItem[] {
  const out: SelfCheckItem[] = [];
  for (const item of attrObjectArray(value)) {
    const question = attrString(item.question);
    const explanation = attrString(item.explanation);
    if (!question || !explanation) continue;
    const options: SelfCheckOption[] = [];
    for (const option of attrObjectArray(item.options)) {
      const text = attrString(option.text);
      if (!text) continue;
      options.push({ text, correct: attrBool(option.correct) });
    }
    if (options.length < 2) continue;
    out.push({ question, options, explanation, anchor: attrString(item.anchor) });
  }
  return out;
}

function diagramDataFrom(value: unknown): DiagramDatum[] {
  const out: DiagramDatum[] = [];
  for (const row of attrObjectArray(value)) {
    const label = attrString(row.label);
    const rowValue = attrCell(row.value);
    if (!label || !rowValue) continue;
    out.push({ label, value: rowValue, note: attrString(row.note) });
  }
  return out;
}

function calcPresetFrom(value: unknown): CalcPreset | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return undefined;
  const out: Record<string, string | number> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (typeof raw === "string" && raw.trim()) out[key] = raw.trim();
    else if (typeof raw === "number" && Number.isFinite(raw)) out[key] = raw;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function Block({ node, headingId }: { node: TiptapNode; headingId?: string }) {
  switch (node.type) {
    case "paragraph":
      if (!node.content?.length) return null;
      return (
        <p className="body-lg text-foreground/85">
          <Inline nodes={node.content} />
        </p>
      );

    case "heading": {
      // `scroll-mt-32` (8rem = 128px), not 28 (01 §4.5). On a lesson the mobile
      // sub-header is a 40px bar under the 72px navbar — exactly 112px, so
      // `scroll-mt-28` lands an anchored heading flush against its bottom edge
      // with zero clearance. The extra 16px is the difference between an anchor
      // that works and one that looks broken. On /news, where there is no
      // sub-header, it is simply a little more breathing room.
      const level = node.attrs?.level === 3 ? 3 : 2;
      if (level === 2) {
        return (
          <div className="mt-2">
            <MeterDivider className="mb-5" />
            <h2 id={headingId} className="display-md scroll-mt-32">
              <Inline nodes={node.content} />
            </h2>
          </div>
        );
      }
      return (
        <h3 id={headingId} className="heading-lg scroll-mt-32">
          <Inline nodes={node.content} />
        </h3>
      );
    }

    case "bulletList":
      return (
        <ul className="body-lg list-disc space-y-2 pl-6 text-foreground/85 marker:text-primary">
          {(node.content ?? []).map((li, i) => (
            <li key={i}>
              <ListItemContent node={li} />
            </li>
          ))}
        </ul>
      );

    case "orderedList":
      return (
        <ol className="body-lg list-decimal space-y-2 pl-6 text-foreground/85 marker:font-mono marker:text-muted-foreground">
          {(node.content ?? []).map((li, i) => (
            <li key={i}>
              <ListItemContent node={li} />
            </li>
          ))}
        </ol>
      );

    case "blockquote":
      // Pull-quote — General Sans 500, amber bar, never italic-serif (07 §4.2, T-banned).
      return (
        <blockquote className="border-l-2 border-primary py-1 pl-5">
          <div className="display-md font-medium text-foreground [&_p]:mt-0">
            {(node.content ?? []).map((child, i) => (
              <Fragment key={i}>
                {child.type === "paragraph" ? (
                  <p className="display-md font-medium leading-snug">
                    <Inline nodes={child.content} />
                  </p>
                ) : (
                  <Block node={child} />
                )}
              </Fragment>
            ))}
          </div>
        </blockquote>
      );

    case "codeBlock":
      // Spec-block — IBM Plex Mono on a surface panel (07 §4.2).
      return (
        <pre className="mono-spec overflow-x-auto rounded-xl border border-border bg-muted/50 p-5 leading-relaxed text-foreground">
          <code>{(node.content ?? []).map(nodeToPlainText).join("")}</code>
        </pre>
      );

    case "image": {
      const src = typeof node.attrs?.src === "string" ? node.attrs.src : null;
      if (!src) return null;
      const alt = typeof node.attrs?.alt === "string" ? node.attrs.alt : "";
      const annotation = typeof node.attrs?.title === "string" ? node.attrs.title : null;
      return (
        <figure className="my-2">
          <div className="relative aspect-[16/9] overflow-hidden rounded-xl border border-border bg-muted">
            <Image src={src} alt={alt} fill sizes="(min-width: 768px) 70ch, 100vw" className="object-cover" />
            {annotation ? (
              <span className="mono-spec absolute left-3 top-3 rounded-md bg-background/80 px-2 py-1 text-foreground ring-1 ring-border backdrop-blur-md">
                {annotation}
              </span>
            ) : null}
          </div>
          {alt ? <figcaption className="caption mt-2 text-muted-foreground">{alt}</figcaption> : null}
        </figure>
      );
    }

    case "horizontalRule":
      return <MeterDivider />;

    /* ---------------- Learn body blocks (03-UI §11.3) ---------------- */

    case "answerBlock": {
      // JAWABAN SINGKAT. Mandatory on every lesson; the lesson template hoists
      // the leading one above the cover so it is the searcher's first screen.
      const fallback = attrString(node.attrs?.fallback);
      const hasProse = Boolean(node.content?.length);
      if (!hasProse) return fallback ? <FallbackParagraph text={fallback} /> : null;
      return (
        <AnswerBlock
          label={attrString(node.attrs?.label) ?? undefined}
          standard={attrString(node.attrs?.standard)}
        >
          <ProseChildren nodes={node.content} />
        </AnswerBlock>
      );
    }

    case "callout": {
      const fallback = attrString(node.attrs?.fallback);
      const hasProse = Boolean(node.content?.length);
      if (!hasProse) return fallback ? <FallbackParagraph text={fallback} /> : null;
      // Cosmetic failure → documented default, not a hole.
      const rawVariant = node.attrs?.variant;
      const variant = isCalloutVariant(rawVariant) ? rawVariant : "catatan";
      return (
        <Callout
          variant={variant}
          title={attrString(node.attrs?.title)}
          source={attrString(node.attrs?.source)}
        >
          <ProseChildren nodes={node.content} />
        </Callout>
      );
    }

    case "specBlock": {
      // RINGKASAN CEPAT: TUJUAN · PRASYARAT · ALAT · BERLAKU · TIDAK BERLAKU.
      const rows = specRowsFrom(node.attrs?.rows);
      const fallback = attrString(node.attrs?.fallback);
      if (rows.length === 0) return fallback ? <FallbackParagraph text={fallback} /> : null;
      return (
        <SpecBlock
          rows={rows}
          title={attrString(node.attrs?.title) ?? "RINGKASAN CEPAT"}
          note={attrString(node.attrs?.note)}
          variant={node.attrs?.variant === "inline" ? "inline" : "lesson"}
        />
      );
    }

    case "comparisonTable": {
      const columns = comparisonColumnsFrom(node.attrs?.columns);
      const rows = comparisonRowsFrom(node.attrs?.rows, columns);
      const caption = attrString(node.attrs?.caption);
      const fallback = attrString(node.attrs?.fallback);
      if (columns.length === 0 || rows.length === 0 || !caption) {
        return fallback ? <FallbackParagraph text={fallback} /> : null;
      }
      return (
        <ComparisonTable
          caption={caption}
          columns={columns}
          rows={rows}
          note={attrString(node.attrs?.note)}
          minWidth={attrString(node.attrs?.minWidth) ?? undefined}
        />
      );
    }

    case "calcEmbed": {
      const tool = node.attrs?.tool;
      const fallback = attrString(node.attrs?.fallback);
      // An unknown tool slug is unrenderable — there is no engine to run.
      if (!isLearnToolSlug(tool)) return fallback ? <FallbackParagraph text={fallback} /> : null;
      return (
        <CalcEmbed
          tool={tool}
          preset={calcPresetFrom(node.attrs?.preset)}
          title={attrString(node.attrs?.title) ?? undefined}
          note={attrString(node.attrs?.note)}
        />
      );
    }

    case "checklist": {
      const items = attrStringArray(node.attrs?.items);
      const fallback = attrString(node.attrs?.fallback);
      if (items.length === 0) return fallback ? <FallbackParagraph text={fallback} /> : null;
      return (
        <ChecklistBlock
          items={items}
          title={attrString(node.attrs?.title) ?? undefined}
          note={attrString(node.attrs?.note)}
          storageKey={attrString(node.attrs?.storageKey) ?? undefined}
        />
      );
    }

    case "selfCheck": {
      const items = selfCheckItemsFrom(node.attrs?.items);
      const fallback = attrString(node.attrs?.fallback);
      if (items.length === 0) return fallback ? <FallbackParagraph text={fallback} /> : null;
      return (
        <SelfCheck
          items={items}
          title={attrString(node.attrs?.title) ?? undefined}
          intro={attrString(node.attrs?.intro)}
        />
      );
    }

    case "keyTakeaways": {
      // INTI — mandatory per lesson (01 §5.2 item 10) and the block that gets
      // screenshotted into a WhatsApp group, which is the real distribution
      // mechanism in Indonesian B2B.
      const items = attrStringArray(node.attrs?.items);
      const fallback = attrString(node.attrs?.fallback);
      if (items.length === 0) return fallback ? <FallbackParagraph text={fallback} /> : null;
      return <KeyTakeaways items={items} title={attrString(node.attrs?.title) ?? undefined} />;
    }

    case "diagramFigure": {
      const title = attrString(node.attrs?.title);
      const data = diagramDataFrom(node.attrs?.data);
      const src = attrString(node.attrs?.src);
      const fallback = attrString(node.attrs?.fallback);
      if (!title || (!src && data.length === 0)) {
        return fallback ? <FallbackParagraph text={fallback} /> : null;
      }
      return (
        <DiagramFigure
          title={title}
          desc={attrString(node.attrs?.desc)}
          caption={attrString(node.attrs?.caption)}
          src={src}
          width={attrNumber(node.attrs?.width)}
          height={attrNumber(node.attrs?.height)}
          data={data}
          dataLabel={attrString(node.attrs?.dataLabel) ?? undefined}
          fallback={fallback ?? undefined}
        />
      );
    }

    default: {
      // A renderer lagging the editor must degrade to a SENTENCE, not a hole
      // (§11.3). Unknown node types that carry a `fallback` attr contribute their
      // indexable text; anything older than that convention still returns null,
      // exactly as before.
      const fallback = attrString(node.attrs?.fallback);
      return fallback ? <FallbackParagraph text={fallback} /> : null;
    }
  }
}

function ListItemContent({ node }: { node: TiptapNode }) {
  // listItem wraps paragraph(s); render inline to avoid stacked <p> margins in a tight list.
  return (
    <>
      {(node.content ?? []).map((child, i) =>
        child.type === "paragraph" ? (
          <Inline key={i} nodes={child.content} />
        ) : (
          <Block key={i} node={child} />
        ),
      )}
    </>
  );
}

function nodeToPlainText(node: TiptapNode): string {
  if (typeof node.text === "string") return node.text;
  return (node.content ?? []).map(nodeToPlainText).join("");
}

export function ArticleBody({ doc, className }: { doc: unknown; className?: string }) {
  if (!isDoc(doc)) return null;
  const headings = collectHeadings(doc);
  let headingIndex = 0;

  return (
    <div className={cn("space-y-6", className)}>
      {(doc.content ?? []).map((node, i) => {
        const isHeading = node.type === "heading" && (node.attrs?.level === 2 || node.attrs?.level === 3);
        const headingId = isHeading ? headings[headingIndex++]?.id : undefined;
        return <Block key={i} node={node} headingId={headingId} />;
      })}
    </div>
  );
}
