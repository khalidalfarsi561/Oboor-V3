import React, { Suspense } from "react";
import { SecretClient } from "../components/secret/SecretClient";
import { Loader2 } from "lucide-react";

interface SecretPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SecretPage({ searchParams }: SecretPageProps) {
  const params = await searchParams;
  const linkId = params.linkId as string | undefined;
  const token = params.token as string | undefined;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-50 p-4 sm:p-6">
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-100/30 blur-[120px]" />

      <Suspense
        fallback={
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          </div>
        }
      >
        <SecretClient linkId={linkId || ""} token={token || ""} />
      </Suspense>
    </div>
  );
}
