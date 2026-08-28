import Link from "next/link";
import { Clock } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";

export default function SessionExpiredPage() {
  return (
    <AuthLayout
      title="Your session has expired"
      subtitle="For your security, please sign in again before viewing financial data."
    >
      <Link
        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-teal-600 bg-teal-600 px-4 text-sm font-medium text-white transition-colors hover:border-teal-700 hover:bg-teal-700"
        href="/login"
      >
        <Clock className="h-4 w-4" aria-hidden="true" />
        Sign In
      </Link>
    </AuthLayout>
  );
}
