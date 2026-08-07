"use client";

import { useCallback, useEffect, useId, useRef } from "react";
import { cn } from "@/lib/utils";

export type ChecklistBlockProps = {
  /**
   * Each item is a question the reader asks *someone else*, never a task they
   * perform (01 §5.3): "Berapa jarak duduk terjauh yang dipakai dalam
   * perhitungan Anda?" — not "Ukur jarak duduk terjauh".
   */
  items: readonly string[];
  /** Default "YANG PERLU ANDA TANYAKAN KE INTEGRATOR". */
  title?: string;
  /** One line under the list. */
  note?: string | null;
  /**
   * Stable key for the session-scoped tick state. Defaults to a React-generated
   * id, which is stable across a hydration but not across a reload — pass the
   * block's own id when a lesson has two checklists.
   */
  storageKey?: string;
  id?: string;
  className?: string;
};

/** Session-scoped, per-page. Deliberately NOT the one persisted `acta.learn.v1` key. */
const PREFIX = "acta.learn.checklist";

function readTicks(key: string): Set<number> {
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((v): v is number => typeof v === "number" && Number.isInteger(v)));
  } catch {
    // Storage disabled, partitioned, or full. A checklist that does not remember
    // is a checklist; a checklist that throws is a broken lesson page.
    return new Set();
  }
}

function writeTicks(key: string, ticks: Set<number>): void {
  try {
    window.sessionStorage.setItem(key, JSON.stringify([...ticks].sort((a, b) => a - b)));
  } catch {
    /* ignore — see readTicks */
  }
}

/**
 * "Yang perlu Anda tanyakan ke integrator" (01 §5.2 item 11, 03-UI §11.3).
 *
 * This is the most quietly commercial block on a lesson page, and it converts by
 * being genuinely useful: every item is a question the reader puts to *another*
 * vendor, and the answers separate a systems integrator from a box reseller.
 *
 * Three implementation decisions worth stating:
 *
 *  1. **The list is complete, plain HTML in the server response.** The checkboxes
 *     are native `<input type="checkbox">` with real `<label>`s, so ticking works
 *     with JavaScript disabled and a crawler reads every question as text. The
 *     client layer adds exactly one thing — the ticks surviving a reload — and
 *     its absence costs nothing. A ticked row also carries a strikethrough, which
 *     is what survives printing when the browser drops background fills.
 *  2. **State lives in `sessionStorage`, not `localStorage`** (03-UI §11.3). A
 *     checklist is a session-scoped worksheet, not a saved artefact, and this
 *     keeps it out of the single persisted `acta.learn.v1` key that the bookmark
 *     subsystem owns.
 *  3. **Restore happens in an effect and mutates the DOM, never React state.**
 *     The server HTML and the first client render are identical unchecked lists
 *     by construction, so there is no hydration mismatch and no CLS — which
 *     matters because the lesson route's CLS budget is 0.05, tighter than the
 *     site default.
 *
 * Rows are `min-h-11` (44px): a 32px checkbox row on a mid-range Android is a
 * rage-tap generator (03-UI §11.6).
 */
export function ChecklistBlock({
  items,
  title = "YANG PERLU ANDA TANYAKAN KE INTEGRATOR",
  note,
  storageKey,
  id,
  className,
}: ChecklistBlockProps) {
  const reactId = useId();
  const rootRef = useRef<HTMLElement | null>(null);
  const keyRef = useRef<string | null>(null);

  const cleaned = items.map((item) => item.trim()).filter(Boolean);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    // Path-scoped so two lessons never share a worksheet, and so the key survives
    // a reload (React ids do not).
    const key = `${PREFIX}:${window.location.pathname}#${storageKey ?? reactId}`;
    keyRef.current = key;
    const ticks = readTicks(key);
    if (ticks.size === 0) return;
    const boxes = root.querySelectorAll<HTMLInputElement>("input[type=checkbox][data-index]");
    boxes.forEach((box) => {
      const index = Number(box.dataset.index);
      if (Number.isInteger(index) && ticks.has(index)) box.checked = true;
    });
  }, [reactId, storageKey]);

  const onToggle = useCallback(() => {
    const root = rootRef.current;
    const key = keyRef.current;
    if (!root || !key) return;
    const ticks = new Set<number>();
    root.querySelectorAll<HTMLInputElement>("input[type=checkbox][data-index]").forEach((box) => {
      const index = Number(box.dataset.index);
      if (box.checked && Number.isInteger(index)) ticks.add(index);
    });
    writeTicks(key, ticks);
  }, []);

  if (cleaned.length === 0) return null;

  return (
    <section
      ref={rootRef}
      id={id}
      aria-label={title}
      className={cn(
        "rounded-lg border border-border bg-card p-5 md:p-6 print:break-inside-avoid",
        className,
      )}
    >
      <p className="mono-label text-accent-text">{title}</p>
      <ul className="mt-4 divide-y divide-border">
        {cleaned.map((item, i) => {
          const inputId = `${reactId}-item-${i}`;
          return (
            <li key={i}>
              <label
                htmlFor={inputId}
                className="flex min-h-11 cursor-pointer items-start gap-3 py-3"
              >
                <input
                  id={inputId}
                  data-index={i}
                  type="checkbox"
                  onChange={onToggle}
                  className={cn(
                    "peer mt-0.5 h-5 w-5 shrink-0 cursor-pointer appearance-none rounded-sm",
                    "border border-foreground/35 bg-transparent",
                    "checked:border-primary checked:bg-primary",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                  )}
                />
                <span className="body-md text-foreground peer-checked:text-muted-foreground peer-checked:line-through">
                  {item}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
      {note ? <p className="caption mt-4 text-muted-foreground">{note}</p> : null}
    </section>
  );
}
