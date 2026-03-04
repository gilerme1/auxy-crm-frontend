"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSuperAdminStats } from "@/lib/api-data";
import { 
  Users, 
  Building2, 
  Truck, 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle,
  DollarSign,
  Wrench
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from "recharts";

const COLORS = ['#0f172a', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

export function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await getSuperAdminStats();
      setStats(data);
    } catch (error) {
      console.error("Error loading admin stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-slate-100 animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  const kpis = [
    { 
      label: "Solicitudes Totales", 
      value: stats?.total, 
      sub: "Histórico completo", 
      icon: Activity, 
      color: "text-auxy-navy",
      bg: "bg-slate-100",
      border: "border-t-auxy-navy"
    },
    { 
      label: "Facturación Global", 
      value: `$${stats?.revenueGlobal?.toLocaleString()}`, 
      sub: "Servicios finalizados", 
      icon: DollarSign, 
      color: "text-green-600",
      bg: "bg-green-50",
      border: "border-t-green-500"
    },
    { 
      label: "Usuarios Activos", 
      value: stats?.entidades?.usuarios, 
      sub: "En toda la red", 
      icon: Users, 
      color: "text-auxy-yellow",
      bg: "bg-yellow-50",
      border: "border-t-auxy-yellow"
    },
    { 
      label: "Empresas Clientes", 
      value: stats?.entidades?.empresas, 
      sub: "Cuentas corporativas", 
      icon: Building2, 
      color: "text-auxy-navy",
      bg: "bg-slate-100",
      border: "border-t-slate-300"
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Panel de Control Global</h1>
          <p className="text-gray-600 mt-1 italic">Bienvenido de nuevo, {user?.nombre}. Monitoreo en tiempo real.</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border shadow-sm">
          <div className={`h-2 w-2 rounded-full bg-green-500 animate-pulse`} />
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider text-[10px]">Sistema Operativo</span>
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
              {idx === 0 && (
                <div className="mt-4 pt-4 border-t flex items-center justify-between text-[11px]">
                   <span className="text-gray-400 font-medium">Hoy: <span className="text-gray-900 font-bold">{stats?.tendenciaHoy?.hoy}</span></span>
                   <div className={`flex items-center gap-0.5 font-bold ${stats?.tendenciaHoy?.diferencia >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {stats?.tendenciaHoy?.diferencia >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {Math.abs(stats?.tendenciaHoy?.diferencia)} vs ayer
                   </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Distribución por Estado */}
        <Card className="lg:col-span-2 shadow-sm border-none">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-auxy-navy" /> Estatus de Solicitudes
            </CardTitle>
            <CardDescription>Distribución actual por fase del servicio</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={Object.entries(stats?.estados || {}).map(([name, value]) => ({ name, value }))}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 500 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" fill="#0f172a" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Tipos de Auxilio */}
        <Card className="shadow-sm border-none">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Wrench className="h-5 w-5 text-auxy-navy" /> Tipos de Auxilio
            </CardTitle>
            <CardDescription>Demanda por categoría</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full items-center flex">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.distribucionTipo || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="cantidad"
                    nameKey="tipo"
                  >
                    {stats?.distribucionTipo?.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {stats?.distribucionTipo?.slice(0, 3).map((t: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="text-gray-600 font-medium">{t.tipo}</span>
                  </div>
                  <span className="font-bold">{t.cantidad}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Network Stats Card */}
      <Card className="border-none shadow-sm bg-slate-900 text-white">
        <CardContent className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            <div className="space-y-4">
              <h3 className="text-xl font-bold">Resumen de la Red Auxy</h3>
              <p className="text-slate-400 text-sm">
                Actualmente contamos con una red de proveedores y empresas clientes 
                que aseguran la continuidad operativa en todo el país.
              </p>
              <div className="flex items-center gap-4 pt-2">
                 <div className="text-center">
                    <p className="text-2xl font-bold">{stats?.entidades?.proveedores}</p>
                    <p className="text-[10px] text-slate-400 uppercase">Proveedores</p>
                 </div>
                 <div className="h-8 w-px bg-slate-700 mx-2" />
                 <div className="text-center">
                    <p className="text-2xl font-bold">{stats?.entidades?.empresas}</p>
                    <p className="text-[10px] text-slate-400 uppercase">Empresas</p>
                 </div>
              </div>
            </div>
            
            <div className="md:col-span-2 bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
               <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-slate-500">Alertas del Sistema</h4>
                  <AlertCircle className="h-4 w-4 text-slate-500" />
               </div>
               <div className="space-y-3">
                  {stats?.estados?.PENDIENTE > 5 && (
                    <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg flex items-center gap-3">
                       <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                       <p className="text-xs text-amber-200">Hay más de 5 solicitudes pendientes de asignación en este momento.</p>
                    </div>
                  )}
                  <div className="bg-slate-700/50 p-3 rounded-lg flex items-center gap-3">
                     <div className="h-2 w-2 rounded-full bg-blue-500" />
                     <p className="text-xs text-slate-300">Todas las integraciones de pago y geocodificación operando con normalidad.</p>
                  </div>
               </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
