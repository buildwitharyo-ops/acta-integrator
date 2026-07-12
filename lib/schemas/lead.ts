import { z } from "zod";

export const leadSchema = z
  .object({
    form_type: z.enum(["quote_form", "contact_form"]),
    name: z.string().min(2, "Nama wajib diisi").max(120),
    company: z.string().max(160).optional(),
    email: z.union([z.email("Email tidak valid"), z.literal("")]).optional(),
    phone: z.string().max(40).optional(),
    message: z.string().max(2000).optional(),
    product_slug: z.string().max(160).optional(),
    solution_slug: z.string().max(160).optional(),
    page_url: z.string().min(1),
    // Honeypot — must stay empty; a filled value marks a bot.
    website: z.string().max(0).optional(),
  })
  .refine((d) => Boolean(d.email?.length) || Boolean(d.phone?.length), {
    message: "Email atau nomor telepon wajib diisi",
    path: ["email"],
  });

export type LeadInput = z.infer<typeof leadSchema>;

export type ActionResult = { ok: true } | { ok: false; error: string };
