import { BrainCircuit, FileSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import type { AiBriefData } from "@/lib/contracts";

export function AiBrief({ brief }: { brief: AiBriefData }) {
  return (
    <Card className="h-full">
      <CardHeader
        eyebrow="Permission-aware intelligence"
        title={brief.title}
        action={<span className="text-xs text-muted">{brief.generatedAt}</span>}
      />
      <CardBody className="space-y-5">
        <p className="text-sm leading-6 text-ink">{brief.body}</p>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase text-muted">Evidence used</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {brief.evidence.map((item) => (
              <div key={item} className="flex items-center gap-2 rounded-md border border-line px-3 py-2">
                <FileSearch className="h-4 w-4 text-blue-600" aria-hidden="true" />
                <span className="text-sm text-ink">{item}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {brief.actions.map((action, index) => (
            <Button
              key={action}
              size="sm"
              variant={index === 0 ? "primary" : "secondary"}
              icon={index === 0 ? <BrainCircuit className="h-4 w-4" /> : undefined}
            >
              {action}
            </Button>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
