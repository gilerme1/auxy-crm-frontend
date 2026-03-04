"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getStatsProveedor } from "@/lib/api-data";
import { Button } from "@/components/ui/button";
import { 
  DollarSign, 
  Truck, 
  Star, 
  CheckCircle2, 
  Timer, 
  ClipboardList,
  ChevronRight,
  TrendingUp
} from "lucide-react";
import Link from "next/link";
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

const STATS_COLORS = ['#0f172a', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

export function ProviderDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await getStatsProveedor();
      setStats(data);
    } catch (error) {
      console.error("Error loading provider stats:", error);
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
      label: "Facturación Total", 
      value: `$${stats?.facturacionTotal?.toLocaleString()}`, 
      sub: "Servicios finalizados", 
      icon: DollarSign, 
      color: "text-green-600",
      bg: "bg-green-50",
      border: "border-t-green-500"
    },
    { 
      label: "Reputación", 
      value: stats?.calificacion ? Number(stats.calificacion).toFixed(1) : "5.0", 
      sub: "Calificación promedio", 
      icon: Star, 
      color: "text-auxy-yellow",
      bg: "bg-yellow-50",
      border: "border-t-auxy-yellow"
    },
    { 
      label: "Vehículos Activos", 
      value: stats?.vehiculosActivos, 
      sub: "Flota registrada", 
      icon: Truck, 
      color: "text-auxy-navy",
      bg: "bg-slate-100",
      border: "border-t-auxy-navy"
    },
    { 
      label: "Servicios Totales", 
      value: stats?.totalServicios, 
      sub: "Gestionados por ti", 
      icon: ClipboardList, 
      color: "text-auxy-navy",
      bg: "bg-slate-100",
      border: "border-t-slate-300"
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Panel Operativo</h1>
          <p className="text-gray-600 mt-1 italic">Control de flota y rendimiento de servicios.</p>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <Card key={idx} className={`shadow-sm hover:shadow-md transition-shadow border-t-4 ${kpi.border}`}>
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
        {/* Distribución de Estados */}
        <Card className="lg:col-span-2 border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Timer className="h-5 w-5 text-auxy-navy" /> Estatus de Servicios
            </CardTitle>
            <CardDescription>Carga de trabajo actual por fase</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={Object.entries(stats?.estados || {}).map(([name, value]) => ({ name, value }))}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Shortcuts y Resumen */}
        <div className="space-y-6">
           <Card className="border-none shadow-sm bg-auxy-navy text-white overflow-hidden relative">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Eficiencia de Flota</CardTitle>
                <CardDescription className="text-slate-400">Objetivo del mes: 95%</CardDescription>
              </CardHeader>
              <CardContent>
                 <div className="flex items-end gap-2">
                    <span className="text-4xl font-bold">88%</span>
                    <span className="text-green-400 text-xs font-bold mb-1 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" /> +2%
                    </span>
                 </div>
                 <div className="mt-4 h-2 w-full bg-slate-800 rounded-full">
                    <div className="h-full w-[88%] bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                 </div>
                 <p className="text-[10px] text-slate-400 mt-4 leading-relaxed">
                   Basado en la relación de servicios aceptados vs rechazados del marketplace.
                 </p>
              </CardContent>
           </Card>

           <Card className="border-none shadow-sm">
             <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-wider text-gray-500">
                  <CheckCircle2 className="h-4 w-4 text-green-500" /> Checklist Operativo
                </CardTitle>
             </CardHeader>
             <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded-lg">
                   <span className="text-gray-600">Conductores Logueados</span>
                   <span className="font-bold">4 / 6</span>
                </div>
                <div className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded-lg">
                   <span className="text-gray-600">Vehículos en Servicio</span>
                   <span className="font-bold">{stats?.estados?.EN_SERVICIO || 0}</span>
                </div>
             </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}

