import { CornerTicks } from "@/components/shared/CornerTicks";
import { WaLearnCta } from "@/components/learn/cta/WaLearnCta";
import { buttonVariants } from "@/components/ui/button";
import {
  ASSET_NOTIFY_COPY,
  ASSET_UNGATED_NOTE,
  LEAD_MAGNETS,
  LEARN_CTA,
  assetMetaLine,
  assetNotifyHeading,
  type LeadMagnet,
  type LeadMagnetId,
} from "@/lib/learn/cta";
import { cn } from "@/lib/utils";

/**
 * Server action that stores the optional WhatsApp number.
 *
 * Receives a `FormData` with:
 *   `phone`        the number as typed — normalise on the server, not here
 *   `asset`        the {@link LeadMagnetId}
 *   `source_path`  the page the card was rendered on
 *   `website`      honeypot; a non-empty value is a bot
 *
 * Typed as a plain React form action so the form keeps working with JavaScript
 * disabled. It must return `void` and signal the outcome by redirecting back to
 * the page (which the route then reflects through `notifyState`) — there is no
 * client-side status hook here, by design.
 */
export type NotifyAction = (formData: FormData) => void | Promise<void>;

/** Outcome of a previous opt-in submission, read by the route from its own URL. */
export type NotifyState = "idle" | "done" | "error";

export type DownloadCardProps = {
  /** Which lead magnet, by id, or a fully-specified asset. */
  asset: LeadMagnetId | LeadMagnet;
  /** Page the card appears on. Used for attribution on the optional opt-in. */
  sourcePath?: string;
  /**
   * Wire a capture action to render the `[ nomor WhatsApp ] [ Kabari saya ]` row.
   * Without it the opt-in degrades to a WhatsApp link, which needs no backend and
   * still returns a number — never to an email field, and never to a gate.
   */
  notifyAction?: NotifyAction;
  /** Confirmation state after `notifyAction` ran. Ignored without one. */
  notifyState?: NotifyState;
  /** Drop the opt-in on a page that already carries one. Default true. */
  showNotify?: boolean;
  id?: string;
  className?: string;
};

/**
 * An ungated lead magnet (03-UI §13.3, decision D9).
 *
 * **The download link is a plain server-rendered `<a href>` to a public file.**
 * No form wall, no modal, no email capture, no token, no redirect — with
 * JavaScript disabled the reader still gets the file, and a crawler still gets
 * the URL. That is not a nicety; it is the whole decision:
 *
 *   • email is the wrong identity currency here — a facility manager types a
 *     throwaway Gmail without hesitating, while the WhatsApp number is the one
 *     they actually answer;
 *   • a form wall five paragraphs into a free lesson is the loudest possible
 *     statement that the lesson was bait;
 *   • a gated file is uncrawlable and un-AI-citable, in a market where the
 *     volume leader already 403s AI crawlers;
 *   • the arithmetic loses — ~400 ungated downloads a month against ~140 gated,
 *     of which maybe 45 addresses are real and monitored. Trading 260
 *     impressions and permanent crawlability for 45 addresses is not a trade.
 *
 * The identity ask therefore sits BELOW a link the reader has already used, is
 * labelled optional, and asks for a number rather than an address.
 *
 * Fully server-rendered: no client hook, no `Input`/`Label` import, so the card
 * ships zero JavaScript. GA4 counts the download through its built-in
 * `file_download` enhanced measurement, which already covers `.pdf` and `.docx`
 * — no click handler is needed and none is added.
 */
export function DownloadCard({
  asset,
  sourcePath,
  notifyAction,
  notifyState = "idle",
  showNotify = true,
  id,
  className,
}: DownloadCardProps) {
  const item = typeof asset === "string" ? LEAD_MAGNETS[asset] : asset;
  const titleId = `${id ?? `unduhan-${item.id}`}-judul`;
  const phoneId = `${id ?? `unduhan-${item.id}`}-wa`;

  return (
    <section
      id={id}
      aria-labelledby={titleId}
      className={cn(
        "relative rounded-md border border-border bg-card p-6 md:p-7 print:break-inside-avoid",
        className,
      )}
    >
      <CornerTicks size={10} />

      <p className="mono-label text-muted-foreground">Unduhan</p>
      <h3 id={titleId} className="heading-lg mt-3 max-w-[38ch] text-foreground">
        {item.title}
      </h3>
      <p className="mono-spec mt-2 text-muted-foreground">{assetMetaLine(item)}</p>

      <p className="body-sm mt-4 max-w-[62ch] text-muted-foreground">{item.summary}</p>
      <p className="caption mt-2 max-w-[62ch] text-muted-foreground">
        Untuk: {item.audience}
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
        <a
          href={item.href}
          className={cn(
            buttonVariants({ variant: "default" }),
            "h-auto min-h-11 max-w-full whitespace-normal py-3 text-left",
          )}
        >
          <DownloadGlyph className="h-4 w-4" />
          {item.downloadLabel}
        </a>
        {/* The single most important line on the card — it pre-empts "ini pasti
            minta email dulu" before the reader has to wonder. Green, not amber:
            it is a reassurance, and the amber budget belongs to the button. */}
        <p className="body-sm font-medium text-status-text">{ASSET_UNGATED_NOTE}</p>
      </div>

      {showNotify && notifyAction && notifyState === "done" ? (
        <div className="mt-7 border-t border-border pt-6">
          <p className="mono-label text-status-text">
            {ASSET_NOTIFY_COPY.doneLabel}
          </p>
          <p className="body-sm mt-2 max-w-[62ch] text-muted-foreground">
            {ASSET_NOTIFY_COPY.doneBody}
          </p>
        </div>
      ) : showNotify ? (
        <div className="mt-7 border-t border-border pt-6">
          <p className="body-sm text-muted-foreground">{assetNotifyHeading(item)}</p>
          <p className="body-sm mt-1 text-foreground">
            {LEARN_CTA.kabari_revisi.heading}{" "}
            <span className="mono-label align-middle text-muted-foreground">
              ({ASSET_NOTIFY_COPY.optionalTag})
            </span>
          </p>

          {notifyAction ? (
            <form
              action={notifyAction}
              className="mt-4 flex flex-wrap items-end gap-3"
            >
              {/* Honeypot — bots fill it, humans never see it (matches lib/actions/leads.ts). */}
              <div aria-hidden className="hidden">
                <label>
                  Website
                  <input type="text" name="website" tabIndex={-1} autoComplete="off" />
                </label>
              </div>
              <input type="hidden" name="asset" value={item.id} />
              <input
                type="hidden"
                name="source_path"
                value={sourcePath ?? item.href}
              />

              <div className="min-w-[13rem] flex-1">
                <label
                  htmlFor={phoneId}
                  className="caption block text-muted-foreground"
                >
                  {ASSET_NOTIFY_COPY.fieldLabel}
                </label>
                {/* Native input, not components/ui/input: this card must stay a
                    server component so the file link needs no JavaScript at all. */}
                <input
                  id={phoneId}
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  required
                  maxLength={40}
                  placeholder={ASSET_NOTIFY_COPY.fieldHint}
                  aria-invalid={notifyState === "error" || undefined}
                  aria-describedby={
                    notifyState === "error"
                      ? `${phoneId}-error ${phoneId}-hint`
                      : `${phoneId}-hint`
                  }
                  className="mt-1.5 flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background md:text-sm"
                />
              </div>

              <button
                type="submit"
                className={cn(buttonVariants({ variant: "secondary" }), "shrink-0")}
              >
                {ASSET_NOTIFY_COPY.submitLabel}
              </button>

              {notifyState === "error" ? (
                <p
                  id={`${phoneId}-error`}
                  role="alert"
                  className="body-sm w-full text-destructive"
                >
                  {ASSET_NOTIFY_COPY.errorLabel}
                </p>
              ) : null}

              <p
                id={`${phoneId}-hint`}
                className="caption w-full text-muted-foreground"
              >
                {LEARN_CTA.kabari_revisi.assurance}
              </p>
            </form>
          ) : (
            <div className="mt-4">
              <WaLearnCta
                cta="kabari_revisi"
                layout="button"
                size="sm"
                buttonVariant="secondary"
                label={ASSET_NOTIFY_COPY.waLabel}
                source={{
                  kind: "unduhan",
                  title: item.title,
                  path: sourcePath ?? item.href,
                }}
                refJalur={item.refJalur}
                refIndex={item.refIndex}
                slug={item.id}
              />
              <p className="caption mt-3 text-muted-foreground">
                {LEARN_CTA.kabari_revisi.assurance}
              </p>
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}

// Functional affordance on the button face, not decoration: a tray with an arrow
// into it. Hand-drawn rather than pulled from an icon library (13 C3).
function DownloadGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      className={className}
      aria-hidden
    >
      <path d="M8 1.5v8.5" />
      <path d="M4.5 7 8 10.5 11.5 7" />
      <path d="M2 12.5v2h12v-2" />
    </svg>
  );
}
