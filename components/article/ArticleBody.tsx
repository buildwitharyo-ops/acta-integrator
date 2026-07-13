import { Fragment } from "react";
import Image from "next/image";
import Link from "next/link";
import { MeterDivider } from "@/components/shared/MeterDivider";
import { collectHeadings, isDoc, type TiptapMark, type TiptapNode } from "@/lib/article";
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
    else if (mark.type === "link") {
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
      const level = node.attrs?.level === 3 ? 3 : 2;
      if (level === 2) {
        return (
          <div className="mt-2">
            <MeterDivider className="mb-5" />
            <h2 id={headingId} className="display-md scroll-mt-28">
              <Inline nodes={node.content} />
            </h2>
          </div>
        );
      }
      return (
        <h3 id={headingId} className="heading-lg scroll-mt-28">
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

    default:
      return null;
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
