"use client";

import { useEffect, Suspense } from "react"; // 1. Importamos Suspense
import { useRouter, useSearchParams } from "next/navigation";
import { setAuthTokens } from "@/lib/auth-storage";
import type { AuthTokens } from "@/types/auth";

// 2. Movemos la lógica a un componente interno
function AuthCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const accessToken = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken");

    if (accessToken && refreshToken) {
      const tokens: AuthTokens = { accessToken, refreshToken };
      setAuthTokens(tokens);
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

// 3. El export default envuelve todo en Suspense
export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-zinc-600">Cargando...</p>
      </div>
    }>
      <AuthCallbackHandler />
    </Suspense>
  );
}