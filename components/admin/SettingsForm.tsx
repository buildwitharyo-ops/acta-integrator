"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { updateSettings } from "@/lib/actions/admin/settings";

type SettingsRow = {
  email: string | null;
  whatsapp_number: string | null;
  instagram: string | null;
  address: string | null;
  city: string | null;
  business_hours: unknown;
  tagline: string | null;
  footer_description: string | null;
  response_claim: string | null;
  claim_verified: boolean | null;
  seo_default_title: string | null;
  seo_default_description: string | null;
  featured_product_id: string | null;
};

type FormValues = {
  email: string;
  whatsapp_number: string;
  instagram: string;
  address: string;
  city: string;
  business_hours: string;
  tagline: string;
  footer_description: string;
  response_claim: string;
  claim_verified: boolean;
  seo_default_title: string;
  seo_default_description: string;
  featured_product_id: string;
};

const inputCls =
  "h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {hint ? <span className="block text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <h2 className="text-sm font-semibold">{title}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export function SettingsForm({
  settings,
  products,
}: {
  settings: SettingsRow | null;
  products: { id: string; name: string | null }[];
}) {
  const [claimVerified, setClaimVerified] = useState(Boolean(settings?.claim_verified));
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit } = useForm<FormValues>({
    defaultValues: {
      email: settings?.email ?? "",
      whatsapp_number: settings?.whatsapp_number ?? "",
      instagram: settings?.instagram ?? "",
      address: settings?.address ?? "",
      city: settings?.city ?? "",
      business_hours: typeof settings?.business_hours === "string" ? settings.business_hours : "",
      tagline: settings?.tagline ?? "",
      footer_description: settings?.footer_description ?? "",
      response_claim: settings?.response_claim ?? "",
      seo_default_title: settings?.seo_default_title ?? "",
      seo_default_description: settings?.seo_default_description ?? "",
      featured_product_id: settings?.featured_product_id ?? "",
    },
  });

  async function onSubmit(values: FormValues) {
    setSaving(true);
    const res = await updateSettings({ ...values, claim_verified: claimVerified });
    setSaving(false);
    if (res.ok) toast.success("Pengaturan disimpan.");
    else toast.error(res.error);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Settings</h1>
          <p className="text-sm text-muted-foreground">Satu sumber untuk kontak, WhatsApp, dan default SEO.</p>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex h-10 items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {saving ? "Menyimpan…" : "Simpan"}
        </button>
      </div>

      <Section title="Kontak">
        <Field label="Email">
          <input type="email" className={inputCls} {...register("email")} />
        </Field>
        <Field label="WhatsApp" hint="Satu sumber untuk semua link wa.me di situs.">
          <input className={inputCls} {...register("whatsapp_number")} />
        </Field>
        <Field label="Instagram">
          <input className={inputCls} {...register("instagram")} />
        </Field>
        <Field label="Kota">
          <input className={inputCls} {...register("city")} />
        </Field>
        <Field label="Alamat">
          <input className={inputCls} {...register("address")} />
        </Field>
        <Field label="Jam Kerja">
          <input className={inputCls} {...register("business_hours")} />
        </Field>
      </Section>

      <Section title="Branding & Footer">
        <Field label="Tagline">
          <input className={inputCls} {...register("tagline")} />
        </Field>
        <Field label="Deskripsi Footer">
          <input className={inputCls} {...register("footer_description")} />
        </Field>
      </Section>

      <section className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-sm font-semibold">Claim CTA</h2>
        <div className="mt-4 space-y-4">
          <Field label="Response Claim" hint="Microcopy CTA, mis. 'Respon < 1 hari kerja'.">
            <input className={inputCls} {...register("response_claim")} />
          </Field>
          <label className="flex items-center gap-3">
            <Switch checked={claimVerified} onCheckedChange={setClaimVerified} />
            <span className="text-sm">
              <span className="font-medium">Claim terverifikasi</span>
              <span className="block text-xs text-muted-foreground">
                Off = publik merender default aman &quot;Tim engineering ACTA akan menghubungi Anda.&quot;
              </span>
            </span>
          </label>
        </div>
      </section>

      <Section title="SEO Default & Mega Menu">
        <Field label="SEO Title Default">
          <input className={inputCls} {...register("seo_default_title")} />
        </Field>
        <Field label="SEO Description Default">
          <input className={inputCls} {...register("seo_default_description")} />
        </Field>
        <Field label="Produk Unggulan (mega menu)">
          <select className={inputCls} {...register("featured_product_id")}>
            <option value="">— tidak ada —</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>
      </Section>
    </form>
  );
}
