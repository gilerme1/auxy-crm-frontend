"use client";

import { useAuth } from "@/contexts/auth-context";
import { AdminReportesDashboard } from "@/components/dashboard/admin-reportes-dashboard";
import { ProviderDashboard } from "@/components/dashboard/provider-dashboard";
import { ClientDashboard } from "@/components/dashboard/client-dashboard";

export default function ReportesPage() {
  const { user } = useAuth();

  if (!user) return null;

  if (user.rol === "SUPER_ADMIN") {
    return <AdminReportesDashboard />;
  }

  if (user.rol === "PROVEEDOR_ADMIN") {
    return <ProviderDashboard />;
  }

  if (user.rol === "CLIENTE_ADMIN") {
    return <ClientDashboard />;
  }

  // Para operadores sin acceso a reportes
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <p className="text-gray-500 text-sm">No tienes acceso a reportes estadísticos.</p>
    </div>
  );
}
