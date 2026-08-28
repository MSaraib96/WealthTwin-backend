import Link from "next/link";
import { ArrowRight, UserPlus } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";

export default function AuthWelcomePage() {
  return (
    <AuthLayout
      title="Secure access to WealthTwin"
      subtitle="Authenticate first, then WealthTwin resolves tenant membership, role, permissions, and data scope before loading financial data."
    >
      <div className="grid gap-3">
        <Link
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-teal-600 bg-teal-600 px-4 text-sm font-medium text-white transition-colors hover:border-teal-700 hover:bg-teal-700"
          href="/login"
        >
          Sign In
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
        <Link
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-line bg-white px-4 text-sm font-medium text-ink transition-colors hover:bg-canvas"
          href="/register"
        >
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          Create Account
        </Link>
      </div>
    </AuthLayout>
  );
}
