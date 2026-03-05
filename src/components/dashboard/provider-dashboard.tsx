"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { getStatsProveedor } from "@/lib/api-data";
import { DollarSign, Truck, Star, CheckCircle2, ClipboardList } from "lucide-react";

export function ProviderDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadStats(); }, []);
  const loadStats = async () => {
    try {
      const data = await getStatsProveedor();
      setStats(data);
    } catch (e) {
      console.error("Error loading provider stats:", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-slate-100 animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-32 bg-slate-100 animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const kpis = [
    {
      label: "Facturación Total",
      value: stats?.facturacionTotal != null ? `$${Number(stats.facturacionTotal).toLocaleString("es-AR")}` : "—",
      sub: "Servicios finalizados cobrados",
      icon: DollarSign,
      color: "text-green-600",
      bg: "bg-green-50",
      border: "border-t-green-500",
    },
    {
      label: "Reputación",
      value: stats?.calificacion != null && Number(stats.calificacion) > 0 ? `${Number(stats.calificacion).toFixed(1)} ★` : "Sin calificaciones",
      sub: "Promedio de servicios calificados",
      icon: Star,
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-t-amber-500",
    },
    {
      label: "Vehículos Activos",
      value: stats?.vehiculosActivos ?? "—",
      sub: "Flota registrada en la plataforma",
      icon: Truck,
      color: "text-emerald-700",
      bg: "bg-slate-100",
      border: "border-t-slate-300",
    },
    {
      label: "Servicios Totales",
      value: stats?.totalServicios ?? "—",
      sub: "Gestionados por tu empresa",
      icon: ClipboardList,
      color: "text-slate-700",
      bg: "bg-slate-100",
      border: "border-t-slate-300",
    },
  ];

  const estadosData = Object.entries(stats?.estados || {}).map(([name, value]) => ({ name, value }));

  const enServicioAhora = stats?.estados?.EN_SERVICIO || 0;
  const enCaminoAhora = stats?.estados?.EN_CAMINO || 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Panel Operativo</h1>
          <p className="text-gray-600 mt-1 italic">Control de flota y rendimiento de servicios — {user?.nombre}</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((k, idx) => (
          <Card key={idx} className={`shadow-sm hover:shadow-md transition-shadow border-t-4 ${k.border}`}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{k.label}</p>
                  <h3 className="text-2xl font-bold text-gray-900 mt-1">{k.value}</h3>
                  <p className="text-[10px] text-gray-500 mt-0.5">{k.sub}</p>
                </div>
                <div className={`p-3 rounded-xl ${k.bg}`}>
                  <k.icon className={`h-5 w-5 ${k.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Distribución de estados */}
      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">Estatus de Servicios</CardTitle>
          <CardDescription>Carga de trabajo actual por fase</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {estadosData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={estadosData} margin={{ left: 0, right: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="p-6 text-sm text-gray-500">Sin datos</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
