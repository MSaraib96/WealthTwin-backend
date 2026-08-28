import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function OAuthButtons() {
  return (
    <div className="space-y-2">
      <Button className="w-full" variant="secondary">
        Continue with Google
      </Button>
      <Button className="w-full" variant="secondary">
        Continue with Microsoft
      </Button>
      <Button className="w-full" icon={<Building2 className="h-4 w-4" />} variant="secondary">
        Continue with SSO
      </Button>
    </div>
  );
}
