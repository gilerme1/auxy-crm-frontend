"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getStatsCliente } from "@/lib/api-data";
import {
  CreditCard,
  Truck,
  Activity,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ─────────────────────────────────────────────────────────────
// CLIENTE_ADMIN — stats reales de su empresa
// ─────────────────────────────────────────────────────────────

export function ClientDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await getStatsCliente();
      setStats(data);
    } catch (error) {
      console.error("Error loading client stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-slate-100 animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-100 animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // ── KPIs reales ────────────────────────────────────────────
  // ✅ totalGastado → _sum.costoFinal de solicitudes FINALIZADAS
  // ✅ estados      → groupBy estado de todas las solicitudes de empresa
  // ✅ frecuenciaIncidentes → groupBy vehiculoId (cantidad de solicitudes por vehículo)
  // ✅ totalSolicitudes → count de finalizadas
  const kpis = [
    {
      label: "Inversión en Auxilio",
      value: stats?.totalGastado != null && !Number.isNaN(Number(stats.totalGastado))
        ? `$${Number(stats.totalGastado).toLocaleString("es-AR")}`
        : "N/A",
      sub: "Total histórico acumulado (servicios finalizados)",
      icon: CreditCard,
      color: "text-auxy-navy",
      bg: "bg-slate-100",
      border: "border-t-auxy-navy",
    },
    {
      label: "Solicitudes Activas",
      value:
        (stats?.estados?.PENDIENTE || 0) +
        (stats?.estados?.ASIGNADO || 0) +
        (stats?.estados?.EN_CAMINO || 0) +
        (stats?.estados?.EN_SERVICIO || 0),
      sub: "En proceso ahora",
      icon: Activity,
      color: "text-auxy-yellow",
      bg: "bg-yellow-50",
      border: "border-t-auxy-yellow",
    },
    {
      label: "Vehículos con Auxilio",
      // frecuenciaIncidentes es un array de { vehiculoId, cantidad }
      value: stats?.frecuenciaIncidentes?.length ?? "—",
      sub: "Vehículos que tuvieron al menos 1 servicio",
      icon: Truck,
      color: "text-auxy-navy",
      bg: "bg-slate-100",
      border: "border-t-slate-300",
    },
    {
      label: "Servicios Finalizados",
      value: stats?.totalSolicitudes ?? "—",
      sub: "Historial completo de la empresa",
      icon: CheckCircle2,
      color: "text-green-600",
      bg: "bg-green-50",
      border: "border-t-green-500",
    },
  ];

  const estadosData = Object.entries(stats?.estados || {}).map(([name, value]) => ({
    name,
    value,
  }));

  // Vehículos con alta frecuencia (más de 3 servicios)
  const vehiculosConAlerta = stats?.frecuenciaIncidentes?.filter(
    (v: any) => v.cantidad > 3
  ) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Mi Flota</h1>
          <p className="text-gray-600 mt-1 italic">
            Control de gastos y operatividad de vehículos — {user?.nombre}
          </p>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <Card
            key={idx}
            className={`shadow-sm hover:-translate-y-1 hover:shadow-md transition-all border-t-4 ${kpi.border}`}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    {kpi.label}
                  </p>
                  <h3 className="text-2xl font-bold text-gray-900 mt-1">{kpi.value}</h3>
                  <p className="text-[10px] text-gray-500 mt-0.5">{kpi.sub}</p>
                </div>
                <div className={`p-3 rounded-xl ${kpi.bg}`}>
                  <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Estados — datos reales */}
        <Card className="lg:col-span-2 border-none shadow-sm h-full">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-auxy-navy" /> Resumen de Solicitudes
            </CardTitle>
            <CardDescription>Estado de los servicios por categoría</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full">
              {estadosData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={estadosData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                    <Tooltip cursor={{ fill: "#f8fafc" }} />
                    <Bar dataKey="value" fill="#0f172a" radius={[4, 4, 0, 0]} barSize={45} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                  Sin datos de solicitudes aún
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ✅ Alertas Operativas — solo datos reales */}
        <div className="space-y-6">
          {/* ✅ ELIMINADO: card de "Tiempo de Respuesta 24 min" (era hardcodeado) */}

          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-wider text-gray-500">
                <AlertTriangle className="h-4 w-4 text-amber-500" /> Alertas Operativas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {vehiculosConAlerta.length > 0 ? (
                <>
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 flex items-start gap-3">
                    <div className="h-2 w-2 rounded-full bg-amber-500 mt-1 shrink-0" />
                    <p className="text-[11px] text-amber-800">
                      {vehiculosConAlerta.length} vehículo(s) con más de 3 servicios registrados.
                      Recomendamos revisión mecánica preventiva.
                    </p>
                  </div>
                </>
              ) : (
                <div className="p-3 bg-green-50 rounded-lg border border-green-100 flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-green-500 mt-1 shrink-0" />
                  <p className="text-[11px] text-green-800">
                    Tu flota se mantiene con niveles bajos de incidencias críticas.
                  </p>
                </div>
              )}

              {/* Desglose de estados activos */}
              {(stats?.estados?.PENDIENTE > 0 || stats?.estados?.EN_CAMINO > 0) && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-blue-500 mt-1 shrink-0" />
                  <p className="text-[11px] text-blue-800">
                    {stats?.estados?.PENDIENTE || 0} solicitud(es) pendiente(s) de asignación.
                    {stats?.estados?.EN_CAMINO > 0 && ` ${stats.estados.EN_CAMINO} auxilio(s) en camino.`}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Frecuencia por vehículo (top 3) */}
          {stats?.frecuenciaIncidentes?.length > 0 && (
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-500">
                  Vehículos más auxiliados
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[...stats.frecuenciaIncidentes]
                  .sort((a: any, b: any) => b.cantidad - a.cantidad)
                  .slice(0, 3)
                  .map((v: any, i: number) => (
                    <div
                      key={v.vehiculoId}
                      className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded-lg"
                    >
                      <span className="text-gray-500 font-mono truncate max-w-[140px]">
                        #{i + 1} — {v.vehiculoId.slice(0, 8)}…
                      </span>
                      <span
                        className={`font-bold ${
                          v.cantidad > 3 ? "text-amber-600" : "text-gray-700"
                        }`}
                      >
                        {v.cantidad} servicio(s)
                      </span>
                    </div>
                  ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
