"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trackEvent } from "@/lib/analytics";
import { submitLead } from "@/lib/actions/leads";
import { leadSchema, type LeadInput } from "@/lib/schemas/lead";

type LeadFormProps = {
  formType?: "quote_form" | "contact_form";
  productSlug?: string;
  solutionSlug?: string;
};

export function LeadForm({
  formType = "contact_form",
  productSlug,
  solutionSlug,
}: LeadFormProps) {
  const pathname = usePathname();
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [done, setDone] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LeadInput>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      form_type: formType,
      product_slug: productSlug,
      solution_slug: solutionSlug,
      page_url: pathname,
      website: "",
    },
  });

  const onSubmit = async (values: LeadInput) => {
    setStatus("submitting");
    const fd = new FormData();
    for (const [key, value] of Object.entries(values)) {
      if (value != null) fd.set(key, String(value));
    }
    fd.set("page_url", pathname);

    const res = await submitLead(fd);
    if (res.ok) {
      setDone(true);
      const item = productSlug ?? solutionSlug ?? null;
      trackEvent("generate_lead", { form_type: formType, item });
      if (formType === "quote_form") {
        trackEvent("quote_request", { product_slug: productSlug ?? null });
      }
    } else {
      setStatus("error");
      setErrorMsg(res.error);
    }
  };

  if (done) {
    return (
      <div className="relative rounded-md bg-card p-6 ring-1 ring-border">
        <p className="mono-label text-status-text">TERKIRIM</p>
        <p className="heading-md mt-2">Permintaan Anda sudah kami terima.</p>
        <p className="body-sm mt-2 text-muted-foreground">
          Tim ACTA akan menghubungi Anda kurang dari 1 hari kerja.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div aria-hidden className="hidden">
        <label>
          Website
          <input type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
        </label>
      </div>

      <Field label="Nama" error={errors.name?.message}>
        <Input placeholder="Nama Anda" {...register("name")} />
      </Field>
      <Field label="Perusahaan">
        <Input placeholder="Nama perusahaan (opsional)" {...register("company")} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Email" error={errors.email?.message}>
          <Input type="email" placeholder="nama@perusahaan.com" {...register("email")} />
        </Field>
        <Field label="No. WhatsApp" error={errors.phone?.message}>
          <Input placeholder="0812…" {...register("phone")} />
        </Field>
      </div>
      <Field label="Kebutuhan">
        <Textarea rows={4} placeholder="Ceritakan kebutuhan sistem AV Anda." {...register("message")} />
      </Field>

      {status === "error" && <p className="body-sm text-destructive">{errorMsg}</p>}

      <Button type="submit" disabled={status === "submitting"} className="w-full">
        {status === "submitting" ? "Mengirim…" : "Kirim Permintaan"}
      </Button>
      <p className="caption text-muted-foreground">
        Respon &lt; 1 hari kerja · Konsultasi awal gratis.
      </p>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="body-sm font-medium">{label}</Label>
      {children}
      {error ? <p className="body-sm text-destructive">{error}</p> : null}
    </div>
  );
}
