"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setAccessToken } from "@/lib/api";

export default function AuthCallbackPage() {
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