import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Angel de Canela — Ariel Collection",
  description:
    "Ariel Collection — Essence of the Sea. Resort wear lookbook por Angel de Canela, Summer 2026.",
  openGraph: {
    title: "Angel de Canela — Ariel Collection",
    description: "Essence of the Sea. Resort wear lookbook, Summer 2026.",
    images: ["/imagenes/1.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
