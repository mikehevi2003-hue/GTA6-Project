import type { Metadata } from "next";
import AuthGate from "@/components/auth/AuthGate";

export const metadata: Metadata = {
  title: "Sign In // ViceLink",
  description: "Sign in or create your ViceLink account to access your synced companion hub."
};

export default function LoginPage() {
  return <AuthGate />;
}
