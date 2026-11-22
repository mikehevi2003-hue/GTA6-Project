import type { Metadata } from "next";
import "@/styles/globals.css";
import "@/styles/vice-ui.css";

export const metadata: Metadata = {
  title: "ViceLink // Leonida Companion Hub",
  description:
    "Private member tactical hub for Leonida: cheat codes, interactive map, verified glitches, economy planner, and AI mission advisor."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
