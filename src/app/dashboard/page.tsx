"use client";

import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { Suspense, lazy, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";

// Dashboards por rol (lazy load para performance)
const ClientDashboard = lazy(() => import("@/components/dashboard/client-dashboard").then(m => ({ default: m.ClientDashboard })));
const OperadorClienteDashboard = lazy(() => import("@/components/dashboard/operador-cliente-dashboard").then(m => ({ default: m.OperadorClienteDashboard })));
const ProviderDashboard = lazy(() => import("@/components/dashboard/provider-dashboard").then(m => ({ default: m.ProviderDashboard })));
const OperadorProveedorDashboard = lazy(() => import("@/components/dashboard/operador-proveedor-dashboard").then(m => ({ default: m.OperadorProveedorDashboard })));
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

  // Redirección si no hay usuario (en efecto, para evitar renders iniciales erróneos)
  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <LoadingFallback />
    );
  }
  if (!user) return null;

  return (
    <Suspense fallback={<LoadingFallback />}> 
      {user.rol === 'SUPER_ADMIN' && <AdminDashboard />}
      {user.rol === 'CLIENTE_ADMIN' && <ClientDashboard />}
      {user.rol === 'CLIENTE_OPERADOR' && <OperadorClienteDashboard />}
      {user.rol === 'PROVEEDOR_ADMIN' && <ProviderDashboard />}
      {user.rol === 'PROVEEDOR_OPERADOR' && <OperadorProveedorDashboard />}
      {/* Rol no contemplado */}
      {!['SUPER_ADMIN','CLIENTE_ADMIN','CLIENTE_OPERADOR','PROVEEDOR_ADMIN','PROVEEDOR_OPERADOR'].includes(user.rol) && (
        <div className="p-8 text-center">Rol no reconocido: {user.rol}</div>
      )}
    </Suspense>
  );
}
