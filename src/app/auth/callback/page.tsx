"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setAuthTokens } from "@/lib/auth-storage";
import type { AuthTokens } from "@/types/auth";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const accessToken = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken");

    if (accessToken && refreshToken) {
      const tokens: AuthTokens = { accessToken, refreshToken };
      setAuthTokens(tokens);
      // En un siguiente paso podemos redirigir al dashboard real
      router.replace("/");
    } else {
      router.replace("/auth/error");
    }
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-zinc-600">Procesando autenticación...</p>
    </div>
  );
}

