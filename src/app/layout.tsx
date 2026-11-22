import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";
import "@/styles/vice-ui.css";
import PwaRegister from "@/components/pwa/PwaRegister";

const SITE_TITLE = "ViceLink // Leonida Companion Hub";
const SITE_DESCRIPTION =
  "Private member tactical hub for Leonida: cheat codes, interactive map, verified glitches, economy planner, and AI mission advisor.";

export const viewport: Viewport = {
  themeColor: "#05070e"
};

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "ViceLink",
    statusBarStyle: "black-translucent"
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.svg", type: "image/svg+xml" },
      { url: "/icons/icon-512.svg", type: "image/svg+xml" }
    ],
    apple: "/icons/icon-192.svg"
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    type: "website",
    siteName: "ViceLink",
    images: [
      {
        url: "/api/og",
        width: 1200,
        height: 630,
        alt: "ViceLink // Leonida Companion Hub"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/api/og"]
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
