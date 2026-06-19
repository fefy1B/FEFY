import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "FEFY Presale | Official Launch | Firefly Ecosystem Token",
  description: "Official FEFY token presale on BSC. Clean Energy Inspired Meme Coin. Secure your allocation before public launch.",
  
  icons: {
    icon: "/fefy-logo.png",
    shortcut: "/fefy-logo.png",
    apple: "/fefy-logo.png",
  },
  
  openGraph: {
    title: "FEFY Presale - Firefly Ecosystem Token",
    description: "Buy FEFY Token presale on BSC. Clean Energy Inspired Meme Coin. Audited, LP Locked, BSC Ready.",
    url: "https://fefy-token.netlify.app",
    siteName: "FEFY Token",
    type: "website",
    images: [
      {
        url: "/fefy-logo.png",
        width: 512,
        height: 512,
        alt: "FEFY Ecosystem Token Logo",
      },
    ],
  },
  
  twitter: {
    card: "summary_large_image",
    title: "FEFY Presale - Firefly Ecosystem Token",
    description: "Buy FEFY Token presale on BSC. Clean Energy Meme Coin 🚀",
    images: ["/fefy-logo.png"],
  },
  
  
  keywords: "FEFY, FEFY token, Firefly Ecosystem, presale, BSC, meme coin, clean energy crypto",
  
  authors: [{ name: "FEFY Team" }],
  
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}