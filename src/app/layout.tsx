import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TISE — Community Events",
  description:
    "A film-roll archive of ColorStack NYC community events, photographed by Tise.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
