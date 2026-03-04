"use client";

import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, Suspense, lazy } from "react";
import { Card, CardContent } from "@/components/ui/card";

const ClientDashboard = lazy(() => import("@/components/dashboard/client-dashboard").then(m => ({ default: m.ClientDashboard })));
const ProviderDashboard = lazy(() => import("@/components/dashboard/provider-dashboard").then(m => ({ default: m.ProviderDashboard })));
const AdminDashboard = lazy(() => import("@/components/dashboard/admin-dashboard").then(m => ({ default: m.AdminDashboard })));

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-auxy-navy mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-auxy-navy mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Admin dashboard
  if (user.rol === "SUPER_ADMIN") {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <AdminDashboard />
      </Suspense>
    );
  }

  // Cliente dashboard
  if (user.rol === "CLIENTE_ADMIN" || user.rol === "CLIENTE_OPERADOR") {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <ClientDashboard />
      </Suspense>
    );
  }

  // Proveedor dashboard
  if (user.rol === "PROVEEDOR_ADMIN" || user.rol === "PROVEEDOR_OPERADOR") {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <ProviderDashboard />
      </Suspense>
    );
  }

  return <div>Rol no reconocido: {user.rol}</div>;
}
