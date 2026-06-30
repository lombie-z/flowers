import type { Metadata } from "next";
import { Geist, Geist_Mono, Rock_3D } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const rock3d = Rock_3D({
  variable: "--font-rock-3d",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Good Talk — Isaac Rozsa",
  description: "Good Talk. Independent album by Isaac Rozsa, tune out everything and shut your eyes.",
  metadataBase: new URL("https://goodtalk.isaacrozsa.com"),
  openGraph: {
    title: "Good Talk — Isaac Rozsa",
    description: "Good Talk. Independent album by Isaac Rozsa, tune out everything and shut your eyes.",
    type: "website",
    siteName: "I. Rozsa",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Good Talk — Isaac Rozsa",
    description: "Good Talk. Independent album by Isaac Rozsa, tune out everything and shut your eyes.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${rock3d.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
