import { LoaderCircle } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";

export default function OAuthCallbackPage() {
  return (
    <AuthLayout
      title="Completing sign in"
      subtitle="WealthTwin is exchanging the provider response through the backend-controlled OAuth flow."
    >
      <div className="flex items-center gap-3 rounded-lg border border-line bg-canvas p-4">
        <LoaderCircle className="h-5 w-5 animate-spin text-teal-600" aria-hidden="true" />
        <p className="text-sm text-ink">Validating identity, tenant membership, and effective permissions...</p>
      </div>
    </AuthLayout>
  );
}
