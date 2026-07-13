"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Field, inputCls, textareaCls } from "@/components/admin/fields";
import { MediaPicker, type MediaItem } from "@/components/admin/MediaPicker";
import { savePageSection } from "@/lib/actions/admin/pages";
import { emptyItem, type FieldDef, type PageSectionRef } from "@/lib/page-sections/registry";

type Content = Record<string, unknown>;

function ScalarInput({ field, value, onChange, media }: { field: FieldDef; value: unknown; onChange: (v: unknown) => void; media: MediaItem[] }) {
  switch (field.type) {
    case "textarea":
      return <textarea rows={field.rows ?? 3} className={textareaCls} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />;
    case "media":
      return <MediaPicker media={media} value={typeof value === "string" && value ? value : null} onChange={(id) => onChange(id)} />;
    case "link": {
      const v = (value as { label?: string; href?: string }) ?? {};
      return (
        <div className="grid gap-2 sm:grid-cols-2">
          <input className={inputCls} placeholder="Label" value={v.label ?? ""} onChange={(e) => onChange({ ...v, label: e.target.value })} />
          <input className={inputCls} placeholder="Href (mis. /solutions)" value={v.href ?? ""} onChange={(e) => onChange({ ...v, href: e.target.value })} />
        </div>
      );
    }
    case "linkLabel": {
      const v = (value as { label?: string }) ?? {};
      return <input className={inputCls} placeholder="Label" value={v.label ?? ""} onChange={(e) => onChange({ label: e.target.value })} />;
    }
    default:
      return <input className={inputCls} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />;
  }
}

function RepeaterField({ field, value, onChange, media }: { field: FieldDef; value: Content[]; onChange: (v: Content[]) => void; media: MediaItem[] }) {
  const sub = field.fields ?? [];
  const atMax = field.max != null && value.length >= field.max;

  function update(i: number, key: string, v: unknown) {
    onChange(value.map((it, idx) => (idx === i ? { ...it, [key]: v } : it)));
  }
  function add() {
    if (atMax) return;
    onChange([...value, emptyItem(sub)]);
  }
  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = value.slice();
    [next[i], next[j]] = [next[j]!, next[i]!];
    onChange(next);
  }

  return (
    <Field label={field.label} hint={field.hint}>
      <div className="space-y-2.5">
        {value.map((item, i) => (
          <div key={i} className="rounded-md border border-border bg-background p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                {field.itemLabel ?? "Item"} {i + 1}
              </span>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30">
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === value.length - 1} className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30">
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={() => onChange(value.filter((_, idx) => idx !== i))} className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div className="space-y-2.5">
              {sub.map((sf) => (
                <Field key={sf.key} label={sf.label} hint={sf.hint}>
                  <ScalarInput field={sf} value={item[sf.key]} onChange={(v) => update(i, sf.key, v)} media={media} />
                </Field>
              ))}
            </div>
          </div>
        ))}
        <button type="button" onClick={add} disabled={atMax} className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted disabled:opacity-50">
          <Plus className="h-3.5 w-3.5" /> Tambah {field.itemLabel ?? "item"}
          {field.max != null ? ` (${value.length}/${field.max})` : ""}
        </button>
      </div>
    </Field>
  );
}

function FieldRenderer({ field, value, onChange, media }: { field: FieldDef; value: unknown; onChange: (v: unknown) => void; media: MediaItem[] }) {
  if (field.type === "repeater") {
    return <RepeaterField field={field} value={Array.isArray(value) ? (value as Content[]) : []} onChange={onChange} media={media} />;
  }
  return (
    <Field label={field.label} hint={field.hint}>
      <ScalarInput field={field} value={value} onChange={onChange} media={media} />
    </Field>
  );
}

export function PageSectionForm({
  pageKey,
  section,
  fields,
  initialContent,
  initialEnabled,
  media,
  defaultOpen = false,
}: {
  pageKey: string;
  section: PageSectionRef;
  fields: FieldDef[];
  initialContent: Content;
  initialEnabled: boolean;
  media: MediaItem[];
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [content, setContent] = useState<Content>(initialContent);
  const [enabled, setEnabled] = useState(initialEnabled);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const res = await savePageSection(pageKey, section.key, content, enabled);
    setSaving(false);
    if (res.ok) toast.success(`${section.label} tersimpan.`);
    else toast.error(res.error);
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between px-5 py-3.5 text-left">
        <div className="flex items-center gap-2.5">
          {open ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
          <div>
            <span className="text-sm font-semibold">{section.label}</span>
            {section.description ? <p className="text-xs text-muted-foreground">{section.description}</p> : null}
          </div>
        </div>
        {!enabled ? <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">off</span> : null}
      </button>
      {open ? (
        <div className="space-y-4 border-t border-border px-5 py-4">
          {fields.map((f) => (
            <FieldRenderer key={f.key} field={f} value={content[f.key]} onChange={(v) => setContent((c) => ({ ...c, [f.key]: v }))} media={media} />
          ))}
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="h-4 w-4 rounded border-border" />
            Section aktif (tampil di situs)
          </label>
          <div className="flex justify-end">
            <button type="button" onClick={save} disabled={saving} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-accent-hover disabled:opacity-60">
              {saving ? "Menyimpan…" : "Simpan section"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
