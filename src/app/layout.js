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

export const metadata = {
  title: "Recarga Express 28 - Rápido y Seguro",
  description:
    "Sistema de control diario de recargas para Payall y PagoDirecto. Digitel, Movistar, Movilnet, SimpleTV, CANTV, Inter a tasa BCV.",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.jpg",
    apple: "/logo.jpg",
  },
};

export const viewport = {
  themeColor: "#060b18",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="min-h-full flex flex-col bg-[#060b18] text-slate-100">{children}</body>
    </html>
  );
}
