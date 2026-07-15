import type { Metadata } from "next";
import { Analytics } from "@/components/shared/Analytics";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import { fontDisplay, fontMono, fontSans } from "@/lib/fonts";
import { SITE_URL } from "@/lib/site-url";
import "./globals.css";

// Root default metadata. metadataBase makes the file-based opengraph-image + any relative canonical
// resolve to absolute URLs; buildMetadata sets the same base per page. Marketing pages override
// title/description/canonical/OG via buildMetadata; locale + siteName cascade to all of them.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "ACTA — Commercial AV & Multimedia Systems Integrator",
  description:
    "PT ACTA Solusi Teknologi — merancang, memasang, dan merawat sistem audio visual komersial terintegrasi di Jakarta & Tangerang.",
  openGraph: { siteName: "ACTA", locale: "id_ID", type: "website" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontDisplay.variable} ${fontMono.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
