import type { Metadata } from "next";
import Link from "next/link";
import { ClearLearnDataButton } from "@/components/learn/save/ClearLearnDataButton";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { JsonLd } from "@/components/shared/JsonLd";
import { MeterDivider } from "@/components/shared/MeterDivider";
import { breadcrumbNode } from "@/lib/jsonld";
import { LEARN_STORAGE_KEY } from "@/lib/learn/save/schema";
import { buildMetadata } from "@/lib/seo";

// UU PDP 27/2022 compliance page (04 §18 R10).
//
// Three panels flagged the obligation and none produced the artifact. It ships before any
// /learn CTA does, because the CTAs are what start collecting: a WhatsApp click hands ACTA a
// phone number, and the ref code embedded in that message is by definition personal data once
// it is attached to an identifiable person in the CRM.
//
// Deliberately written to be readable rather than lawyerly. A privacy page nobody can parse
// satisfies a checkbox, not a person.

export const metadata: Metadata = buildMetadata({
  title: "Kebijakan Privasi | ACTA",
  description:
    "Bagaimana ACTA mengumpulkan, menggunakan, dan menyimpan data Anda — termasuk data belajar yang tersimpan di browser Anda sendiri.",
  path: "/privasi",
});

const UPDATED = "7 Agustus 2026";

export default function PrivasiPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbNode([
          { name: "Beranda", path: "/" },
          { name: "Kebijakan Privasi", path: "/privasi" },
        ])}
      />

      <div className="container max-w-[70ch] py-16 md:py-24">
        <Breadcrumb
          items={[{ name: "Beranda", href: "/" }, { name: "Kebijakan Privasi" }]}
        />

        <p className="mono-label mt-8 text-accent-text">KEBIJAKAN PRIVASI</p>
        <h1 className="font-display mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
          Data Anda, dan apa yang kami lakukan dengannya
        </h1>
        <p className="mono-spec mt-4 text-sm text-muted-foreground">
          Terakhir diperbarui: {UPDATED} · Dasar hukum: UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi
        </p>

        <MeterDivider className="my-10" />

        <div className="space-y-10 leading-relaxed">
          <section>
            <h2 className="font-display text-2xl font-semibold">Ringkasnya</h2>
            <p className="mt-3 text-muted-foreground">
              Anda bisa membaca seluruh materi di situs ini tanpa membuat akun, tanpa memberikan
              email, dan tanpa mengisi formulir apa pun. Kami tidak menjual data siapa pun. Data
              pribadi baru berpindah ke kami ketika <em>Anda</em> yang memulai kontak — menekan
              tombol WhatsApp, mengirim hasil kalkulator, atau mengisi formulir konsultasi.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold">1. Apa yang kami kumpulkan</h2>

            <h3 className="mt-6 font-display text-lg font-medium">a. Data belajar — disimpan di browser Anda, bukan di server kami</h3>
            <p className="mt-2 text-muted-foreground">
              Ketika Anda menyimpan sebuah pelajaran (&ldquo;Simpan&rdquo;) atau membuka halaman di
              bagian Learn, situs ini mencatatnya di penyimpanan lokal browser Anda dengan kunci{" "}
              <code className="mono-spec rounded bg-muted px-1.5 py-0.5 text-sm">{LEARN_STORAGE_KEY}</code>.
              Data ini <strong>tidak pernah dikirim ke server ACTA</strong>. Tidak ada akun, tidak ada
              profil, dan kami tidak bisa melihat isinya. Data itu hilang jika Anda menghapus data
              browser, dan tidak berpindah ke perangkat lain.
            </p>

            <h3 className="mt-6 font-display text-lg font-medium">b. Analitik</h3>
            <p className="mt-2 text-muted-foreground">
              Kami memakai Google Analytics 4 untuk mengetahui halaman mana yang dibaca dan tombol
              mana yang ditekan — dalam bentuk agregat. IP dianonimkan oleh GA4. Kami tidak memakai
              analitik untuk mengidentifikasi Anda secara pribadi.
            </p>

            <h3 className="mt-6 font-display text-lg font-medium">c. Ketika Anda menghubungi kami</h3>
            <p className="mt-2 text-muted-foreground">
              Jika Anda menekan tombol WhatsApp, menekan kirim pada hasil kalkulator, atau mengisi
              formulir kontak, kami menerima apa yang Anda kirimkan: nama, nomor WhatsApp, perusahaan
              (bila diisi), dan konteks halaman asal — termasuk kode referensi pendek seperti{" "}
              <code className="mono-spec rounded bg-muted px-1.5 py-0.5 text-sm">AKU-08-4KM2</code>{" "}
              yang tercetak di badan pesan. Kode itu hanya menandai <em>halaman mana</em> yang Anda
              baca sebelum menghubungi kami; ia tidak melacak Anda antar situs.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold">2. Dasar hukum pemrosesan</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-muted-foreground">
              <li>
                <strong>Persetujuan</strong> — untuk analitik, dan untuk data yang Anda kirim melalui
                formulir atau WhatsApp.
              </li>
              <li>
                <strong>Kepentingan yang sah</strong> — untuk menjawab pertanyaan Anda dan menyiapkan
                penawaran yang Anda minta.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold">3. Berapa lama kami menyimpannya</h2>
            <div className="mono-spec mt-4 overflow-x-auto">
              <table className="w-full min-w-[28rem] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="py-2 pr-4 font-medium">Data</th>
                    <th className="py-2 pr-4 font-medium">Retensi</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b border-border/60">
                    <td className="py-2 pr-4">Data belajar di browser</td>
                    <td className="py-2 pr-4">Sampai Anda menghapusnya sendiri</td>
                  </tr>
                  <tr className="border-b border-border/60">
                    <td className="py-2 pr-4">Analitik GA4 (agregat)</td>
                    <td className="py-2 pr-4">14 bulan</td>
                  </tr>
                  <tr className="border-b border-border/60">
                    <td className="py-2 pr-4">Percakapan &amp; data prospek</td>
                    <td className="py-2 pr-4">24 bulan sejak kontak terakhir</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Dokumen proyek yang berjalan</td>
                    <td className="py-2 pr-4">Sesuai kewajiban administrasi &amp; pajak</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold">4. Hak Anda</h2>
            <p className="mt-3 text-muted-foreground">
              Berdasarkan UU PDP 27/2022 Anda berhak meminta akses, koreksi, penghapusan, dan
              penarikan persetujuan atas data pribadi Anda. Untuk data yang ada pada kami, hubungi
              kontak di bawah — kami menjawab dalam 14 hari kerja.
            </p>

            <div className="mt-6 rounded-lg border border-border bg-card p-5">
              <p className="font-medium">Hapus data belajar di perangkat ini</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Data belajar tersimpan di browser Anda, jadi Anda yang menghapusnya — langsung, tanpa
                perlu meminta ke kami.
              </p>
              <div className="mt-4">
                <ClearLearnDataButton />
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold">5. Kontak</h2>
            <p className="mt-3 text-muted-foreground">
              Pertanyaan atau permintaan terkait data pribadi:{" "}
              <a
                href="mailto:acta.arc@gmail.com"
                className="text-accent-text underline underline-offset-4"
              >
                acta.arc@gmail.com
              </a>
              . Anda juga bisa menghubungi kami lewat halaman{" "}
              <Link href="/contact" className="text-accent-text underline underline-offset-4">
                Kontak
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
