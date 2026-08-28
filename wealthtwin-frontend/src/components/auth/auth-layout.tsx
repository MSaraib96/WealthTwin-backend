import Link from "next/link";
import type { ReactNode } from "react";
import { Gauge, LockKeyhole, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";

export function AuthLayout({
  title,
  subtitle,
  children,
  footer
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-canvas px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col justify-center gap-8">
        <section className="mx-auto w-full max-w-2xl text-center">
          <Link className="mx-auto inline-flex items-center gap-3" href="/login">
            <span className="grid h-12 w-12 place-items-center rounded-lg bg-teal-600 text-white">
              <Gauge className="h-6 w-6" aria-hidden="true" />
            </span>
            <span className="text-left">
              <span className="block text-2xl font-semibold text-ink">WealthTwin</span>
              <span className="block text-sm text-muted">Financial Intelligence for your business</span>
            </span>
          </Link>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Badge status="healthy">Secure</Badge>
            <Badge status="info">Private</Badge>
            <Badge status="warning">Enterprise</Badge>
          </div>
        </section>

        <Card className="mx-auto w-full max-w-[520px]">
          <CardBody className="p-5 sm:p-7">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-ink">{title}</h1>
              <p className="mt-2 text-sm leading-6 text-muted">{subtitle}</p>
            </div>
            {children}
            {footer ? <div className="mt-6 border-t border-line pt-5">{footer}</div> : null}
          </CardBody>
        </Card>

        <section className="mx-auto grid w-full max-w-2xl gap-3 text-sm text-muted sm:grid-cols-2">
          <div className="flex items-center justify-center gap-2">
            <LockKeyhole className="h-4 w-4 text-teal-600" aria-hidden="true" />
            HttpOnly session architecture
          </div>
          <div className="flex items-center justify-center gap-2">
            <ShieldCheck className="h-4 w-4 text-blue-600" aria-hidden="true" />
            Tenant-aware authorization
          </div>
        </section>
      </div>
    </main>
  );
}
