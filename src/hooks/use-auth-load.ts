import { useAuth } from "@/contexts/auth-context";
import { useEffect, useState } from "react";

interface UseAuthLoadOptions {
  enabled?: boolean;
}

export function useAuthLoad({ enabled = true }: UseAuthLoadOptions = {}) {
  const { user, loading: authLoading } = useAuth();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setIsReady(true);
      return;
    }

    if (!authLoading && user !== undefined) {
      setIsReady(true);
    } else if (!authLoading && user === undefined) {
      setIsReady(true);
    }
  }, [authLoading, user, enabled]);

  return {
    user,
    authLoading,
    isReady: !enabled || isReady,
    canLoadData: !authLoading && user !== null,
  };
}

export function usePageAuth() {
  const { user, loading: authLoading, isAuthenticated, logout } = useAuth();

  return {
    user,
    authLoading,
    isAuthenticated,
    isCliente: user?.rol === "CLIENTE_ADMIN" || user?.rol === "CLIENTE_OPERADOR",
    isProveedor: user?.rol === "PROVEEDOR_ADMIN" || user?.rol === "PROVEEDOR_OPERADOR",
    isSuperAdmin: user?.rol === "SUPER_ADMIN",
    isAdmin: user?.rol === "CLIENTE_ADMIN" || user?.rol === "PROVEEDOR_ADMIN" || user?.rol === "SUPER_ADMIN",
    logout,
  };
}
