import Link from "next/link";
import { CircleOff } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";

export default function AccountDeactivatedPage() {
  return (
    <AuthLayout
      title="Account deactivated"
      subtitle="This account cannot access WealthTwin. Contact your organization administrator if you believe this is incorrect."
    >
      <div className="space-y-3">
        <div className="rounded-lg border border-red-100 bg-red-50 p-4">
          <p className="flex gap-2 text-sm leading-6 text-red-600">
            <CircleOff className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            Active sessions for deactivated accounts are revoked by the backend.
          </p>
        </div>
        <Link
          className="inline-flex h-10 w-full items-center justify-center rounded-md border border-line bg-white px-4 text-sm font-medium text-ink transition-colors hover:bg-canvas"
          href="/login"
        >
          Back to Sign In
        </Link>
      </div>
    </AuthLayout>
  );
}
