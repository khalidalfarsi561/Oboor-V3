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
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-100/30 blur-[120px] rounded-full pointer-events-none" />
      
      <Suspense fallback={
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        </div>
      }>
        <SecretClient linkId={linkId || ""} token={token || ""} />
      </Suspense>
    </div>
  );
}
