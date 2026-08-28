import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";

export default function UnauthorizedPage() {
  return (
    <AuthLayout
      title="Access denied"
      subtitle="Your role or data permissions do not allow access to this page. No restricted data was loaded."
    >
      <div className="space-y-3">
        <div className="rounded-lg border border-amber-100 bg-amber-50 p-4">
          <p className="flex gap-2 text-sm leading-6 text-amber-600">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            The backend remains authoritative for this denial.
          </p>
        </div>
        <Link
          className="inline-flex h-10 w-full items-center justify-center rounded-md border border-teal-600 bg-teal-600 px-4 text-sm font-medium text-white transition-colors hover:border-teal-700 hover:bg-teal-700"
          href="/command-center"
        >
          Return to Command Center
        </Link>
      </div>
    </AuthLayout>
  );
}
