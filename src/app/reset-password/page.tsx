import type { Metadata } from "next";
import ResetPasswordGate from "@/components/auth/ResetPasswordGate";

export const metadata: Metadata = {
  title: "Reset Password // ViceLink Vault",
  description:
    "Set a new password for your ViceLink account with real-time security verification."
};

export default function ResetPasswordPage() {
  return <ResetPasswordGate />;
}
