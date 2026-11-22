import type { Metadata } from "next";
import LegalPageShell from "@/components/legal/LegalPageShell";

export const metadata: Metadata = {
  title: "Terms of Service // ViceLink",
  description: "ViceLink Terms of Service, one-time lifetime pass licensing, and unofficial fan hub notice."
};

export default function TermsPage() {
  return <LegalPageShell active="terms" />;
}
