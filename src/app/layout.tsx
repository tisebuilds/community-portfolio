import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const ioskeleyMono = localFont({
  src: [
    {
      path: "./fonts/IoskeleyMono-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/IoskeleyMono-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TISE — Community Events",
  description:
    "A Weekly Archive Of ColorStack NYC Community Events, Photographed By Tise.",
};

const themeInitScript = `(function(){try{var t=localStorage.getItem("theme");var d=t==="dark"||(t!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);if(d)document.documentElement.setAttribute("data-theme","dark");}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={ioskeleyMono.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={ioskeleyMono.className}>{children}</body>
    </html>
  );
}
