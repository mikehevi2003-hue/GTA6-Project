import type { Metadata } from "next";
import LegalPageShell from "@/components/legal/LegalPageShell";

export const metadata: Metadata = {
  title: "Privacy Policy (Law 81) // ViceLink",
  description: "ViceLink Privacy Policy under Panama Law 81 of 2019: minimal data collection, payment security, and export rights."
};

export default function PrivacyPage() {
  return <LegalPageShell active="privacy" />;
}
