"use client";
import React, { useEffect, useState } from 'react';
import { getSuperAdminStats } from '@/lib/api-data';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import { DollarSign, Truck, ClipboardList, Activity, CheckCircle2 } from 'lucide-react';

// Inicio AdminDashboard: estado operativo actual
export function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadStats(); }, []);
  const loadStats = async () => {
    try {
      const data = await getSuperAdminStats();
      setStats(data);
    } catch (e) {
      console.error('Error loading super admin stats:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-slate-100 animate-pulse rounded" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[1,2,3,4,5].map((i) => (
            <div key={i} className="h-28 bg-slate-100 animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  type DistribTipo = { tipo: string; cantidad: number };
  const s = stats || {};
  const distribucionTipoData = ((s.distribucionTipo as DistribTipo[]) || []) as DistribTipo[];
  const kpis = [
    { label: 'Solicitudes Totales', value: s.total ?? '—', border: 'border-t-auxy-navy' },
    { label: 'Facturación Global', value: s.revenueGlobal != null ? `$${Number(s.revenueGlobal).toLocaleString('es-AR')}` : '—', border: 'border-t-green-500' },
    { label: 'Usuarios Activos', value: s.entidades?.usuarios ?? '—', border: 'border-t-slate-300' },
    { label: 'Empresas Clientes', value: s.entidades?.empresas ?? '—', border: 'border-t-slate-300' },
    { label: 'Proveedores Activos', value: s.entidades?.proveedores ?? '—', border: 'border-t-slate-300' },
  ];

  const estadosData = Object.entries(s.estados || {}).map(([name, value]) => ({ name, value }));
  const colors = ['#4ade80','#f472b6','#60a5fa','#facc15','#a78bfa','#34d399'];
const tendenciaHoy = s.tendenciaHoy || { hoy:0, ayer:0 };

  return (
    <div className="space-y-6 p-4">
      <div className="flex flex-wrap gap-6 items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Panel Administrativo</h1>
          <p className="text-gray-600 mt-1">Visión general de la plataforma Auxy</p>
        </div>
        <div className="flex gap-3">
          <a href="/dashboard/empresas" className="px-3 py-2 rounded border inline-flex items-center">Empresas</a>
          <a href="/dashboard/proveedores" className="px-3 py-2 rounded border inline-flex items-center">Proveedores</a>
          <a href="/dashboard/usuarios" className="px-3 py-2 rounded border inline-flex items-center">Usuarios</a>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {kpis.map((kp, idx) => (
          <Card key={idx} className={`shadow-sm border-t-4 ${kp.border}`}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{kp.label}</p>
                  <div className="text-2xl font-bold text-gray-900 mt-1">{kp.value}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Distribución por estado */}
      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">Estatus de Servicios</CardTitle>
          <CardDescription>Carga de trabajo actual por fase</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {estadosData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={estadosData} margin={{ left: 0, right: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#0f172a" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="p-6 text-sm text-gray-500">Sin datos</div>
          )}
        </CardContent>
      </Card>

      {/* Distribución por tipo (tipo de auxilio) */}
      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">Tipo de Auxilio</CardTitle>
          <CardDescription>Distribución por tipo</CardDescription>
        </CardHeader>
        <CardContent>
          {distribucionTipoData.length > 0 ? (
            <div style={{ display: 'flex', height: 260 }}>
            <PieChart width={400} height={260}>
              <Pie data={distribucionTipoData} dataKey="cantidad" nameKey="tipo" cx="50%" cy="50%" outerRadius={80} label>
                {distribucionTipoData.map((entry: DistribTipo, index: number) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </div>
          ) : (
            <div className="p-6 text-sm text-gray-500">Sin datos</div>
          )}
        </CardContent>
      </Card>

      {/* Tendencia - resumen simple para reporte */}
      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">Tendencia</CardTitle>
          <CardDescription>Solicitudes hoy vs ayer</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex gap-4 text-sm text-gray-700">
            <div>Hoy: {tendenciaHoy.hoy ?? 0}</div>
            <div>Ayer: {tendenciaHoy.ayer ?? 0}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminDashboard;
