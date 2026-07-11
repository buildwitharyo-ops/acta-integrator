import { Inter, IBM_Plex_Mono } from "next/font/google";
import localFont from "next/font/local";

export const fontSans = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

export const fontMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const fontDisplay = localFont({
  src: "../fonts/GeneralSans-Variable.woff2",
  weight: "200 700",
  variable: "--font-display",
  display: "swap",
});
