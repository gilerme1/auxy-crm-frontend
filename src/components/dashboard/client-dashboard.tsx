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
  Clock, 
  AlertTriangle,
  FileText,
  BarChart3
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from "recharts";

const CLIENT_COLORS = ['#0f172a', '#64748b', '#94a3b8', '#cbd5e1'];

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

  const kpis = [
    { 
      label: "Inversión en Auxilio", 
      value: `$${stats?.totalGastado?.toLocaleString()}`, 
      sub: "Total histórico acumulado", 
      icon: CreditCard, 
      color: "text-auxy-navy",
      bg: "bg-slate-100",
      border: "border-t-auxy-navy"
    },
    { 
      label: "Solicitudes Activas", 
      value: (stats?.estados?.PENDIENTE || 0) + (stats?.estados?.ASIGNADO || 0) + (stats?.estados?.EN_CAMINO || 0) + (stats?.estados?.EN_SERVICIO || 0), 
      sub: "En proceso ahora", 
      icon: Activity, 
      color: "text-auxy-yellow",
      bg: "bg-yellow-50",
      border: "border-t-auxy-yellow"
    },
    { 
      label: "Flota Protegida", 
      value: stats?.frecuenciaIncidentes?.length || 0, 
      sub: "Vehículos con historial", 
      icon: Truck, 
      color: "text-auxy-navy",
      bg: "bg-slate-100",
      border: "border-t-slate-300"
    },
    { 
      label: "Servicios Finalizados", 
      value: stats?.totalSolicitudes, 
      sub: "Historial completo", 
      icon: CheckCircle2, 
      color: "text-green-600",
      bg: "bg-green-50",
      border: "border-t-green-500"
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Mi Flota</h1>
          <p className="text-gray-600 mt-1 italic">Control de gastos y operatividad de vehículos.</p>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <Card key={idx} className={`shadow-sm hover:-translate-y-1 hover:shadow-md transition-all border-t-4 ${kpi.border}`}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{kpi.label}</p>
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
        {/* Gráfico de Estados */}
        <Card className="lg:col-span-2 border-none shadow-sm h-full">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-auxy-navy" /> Resumen de Solicitudes
            </CardTitle>
            <CardDescription>Estado de los servicios por categoría</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={Object.entries(stats?.estados || {}).map(([name, value]) => ({ name, value }))}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="value" fill="#0f172a" radius={[4, 4, 0, 0]} barSize={45} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Alertas y Tips */}
        <div className="space-y-6">
          <Card className="border-none shadow-sm overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100">
             <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-wider text-slate-500">
                  <Clock className="h-4 w-4" /> Tiempo de Respuesta
                </CardTitle>
             </CardHeader>
             <CardContent>
                <div className="text-3xl font-bold text-slate-900">24 min</div>
                <p className="text-[10px] text-slate-500 mt-1">Promedio de llegada de asistencia</p>
                <div className="mt-4 p-3 bg-white rounded-lg border border-slate-200">
                   <p className="text-[11px] text-slate-600 leading-relaxed font-medium italic">
                     "Tu tiempo de respuesta ha bajado un 5% respecto al mes pasado."
                   </p>
                </div>
             </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
             <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-wider text-gray-500">
                  <AlertTriangle className="h-4 w-4 text-amber-500" /> Alertas Operativas
                </CardTitle>
             </CardHeader>
             <CardContent className="space-y-3">
                {stats?.frecuenciaIncidentes?.some((v: any) => v.cantidad > 3) ? (
                   <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 flex items-start gap-3">
                      <div className="h-2 w-2 rounded-full bg-amber-500 mt-1" />
                      <p className="text-[11px] text-amber-800">
                         Tienes vehículos con alta frecuencia de incidentes (+3). Recomendamos revisión mecánica.
                      </p>
                   </div>
                ) : (
                   <div className="p-3 bg-green-50 rounded-lg border border-green-100 flex items-start gap-3">
                      <div className="h-2 w-2 rounded-full bg-green-500 mt-1" />
                      <p className="text-[11px] text-green-800">
                         Tu flota se mantiene con niveles bajos de incidencias críticas.
                      </p>
                   </div>
                )}
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
