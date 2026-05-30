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
  title: "PitchPilot AI — Real-Time AI Pitch Coach for Founders",
  description:
    "Practice your startup pitch with live AI feedback, investor simulation, structure analysis, and analytics. Built for YC-ready founders.",
  keywords: ["pitch coach", "startup", "YC", "founder", "AI", "investor simulation"],
  openGraph: {
    title: "PitchPilot AI",
    description: "Real-time AI pitch coaching for startup founders",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen max-w-[100vw] overflow-x-hidden antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
