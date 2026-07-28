"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setAccessToken } from "@/lib/api";

function Callback() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      router.replace("/");
      return;
    }

    setAccessToken(token);
    router.replace("/");
  }, [router, searchParams]);

  return (
    <div className="flex h-screen items-center justify-center">
      <p>Signing you in...</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <p>Signing you in...</p>
        </div>
      }
    >
      <Callback />
    </Suspense>
  );
}