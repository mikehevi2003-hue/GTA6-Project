import type { Metadata } from "next";
import LegalPageShell from "@/components/legal/LegalPageShell";

export const metadata: Metadata = {
  title: "Refund Policy // ViceLink",
  description: "ViceLink Refund Policy for instant digital passes (Street Pass & Kingpin VIP) via Yappy and Card rails."
};

export default function RefundsPage() {
  return <LegalPageShell active="refunds" />;
}
