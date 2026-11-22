import type { Metadata } from "next";
import LegalPageShell from "@/components/legal/LegalPageShell";

export const metadata: Metadata = {
  title: "Copyright, Fair-Use Facts & DMCA Safe Harbor // ViceLink",
  description:
    "ViceLink independent software utility disclosures, intellectual property boundaries, and expedited 48-hour DMCA / Panama Law 64 takedown contact."
};

export default function DmcaPage() {
  return <LegalPageShell active="dmca" />;
}
