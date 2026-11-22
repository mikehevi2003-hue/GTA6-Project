import type { Metadata } from "next";
import AuthGate from "@/components/auth/AuthGate";

export const metadata: Metadata = {
  title: "Sign In // ViceLink Leonida Command Hub",
  description:
    "Sign in, create your ViceLink account, or recover your password with step-up TOTP 2FA protection."
};

export default function LoginPage() {
  return <AuthGate />;
}
