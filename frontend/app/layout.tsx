import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: "StatusWatch — Uptime & SSL Monitor + Public Status Page",
    template: "%s | StatusWatch",
  },
  description:
    "Pantau ketersediaan dan sertifikat SSL situs web Anda secara real-time. Tahu duluan sebelum pelanggan Anda tahu dengan StatusWatch.",
  keywords: [
    "uptime monitor",
    "ssl monitor",
    "status page",
    "pemantauan server",
    "status watch",
  ],
  authors: [{ name: "StatusWatch Team" }],
  openGraph: {
    title: "StatusWatch — Uptime & SSL Monitor + Public Status Page",
    description:
      "Pantau ketersediaan dan sertifikat SSL situs web Anda secara real-time. Tahu duluan sebelum pelanggan Anda tahu.",
    url: "/",
    siteName: "StatusWatch",
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "StatusWatch — Uptime & SSL Monitor",
    description:
      "Pantau ketersediaan dan sertifikat SSL situs web Anda secara real-time. Tahu duluan sebelum pelanggan Anda tahu.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('statuswatch-theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;if(t==='dark'||(!t&&d)){document.documentElement.classList.add('dark')}else{document.documentElement.classList.remove('dark')}}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
