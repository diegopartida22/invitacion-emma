import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Jost, Pinyon_Script } from "next/font/google";
import { EVENT } from "@/lib/event";
import { staticSiteUrl } from "@/lib/site";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const pinyon = Pinyon_Script({
  variable: "--font-pinyon",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  // Sin esto Next arma las URLs de las imágenes OG contra localhost y
  // WhatsApp no puede descargarlas: el preview sale sin foto.
  metadataBase: staticSiteUrl(),
  title: `Primera Comunión de ${EVENT.child}`,
  description: `${EVENT.dateLabel} · Acompáñanos en este día tan especial.`,
  openGraph: {
    title: `Primera Comunión de ${EVENT.child}`,
    description: `${EVENT.dateLabel} · Acompáñanos en este día tan especial.`,
    type: "website",
    locale: "es_MX",
    siteName: `Primera Comunión de ${EVENT.child}`,
  },
  twitter: { card: "summary_large_image" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#efe2da",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      className={`${cormorant.variable} ${pinyon.variable} ${jost.variable} antialiased`}
    >
      <body>{children}</body>
    </html>
  );
}
