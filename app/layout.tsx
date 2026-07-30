import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Catálogo Digital",
    template: "Catálogo Digital — %s",
  },
  description: "Catálogos digitales interactivos con descarga en PDF.",
  openGraph: {
    title: "Catálogo Digital",
    description: "Catálogos digitales interactivos con descarga en PDF.",
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
