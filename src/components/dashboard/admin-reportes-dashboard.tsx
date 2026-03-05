"use client";
import React, { useEffect, useState } from 'react';
import { getSuperAdminStats } from '@/lib/api-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PieChart, Pie, Cell, Legend } from 'recharts';
import { DollarSign, Truck, ClipboardList } from 'lucide-react';
import Link from 'next/link';

type DistribTipo = { tipo: string; cantidad: number };

export function AdminReportesDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadStats(); }, []);
  const loadStats = async () => {
    try {
      const data = await getSuperAdminStats();
      setStats(data);
    } catch (e) {
      console.error('Error loading super admin stats (reportes):', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-4">
        <div className="h-10 w-48 bg-slate-100 animate-pulse rounded" />
        <div className="h-48 bg-slate-100 animate-pulse rounded-xl" />
      </div>
    );
  }

  const s = stats || {};
  const { entidades = { empresas: 0, proveedores: 0, usuarios: 0 } } = s;
  const distribucionTipo = (s.distribucionTipo as DistribTipo[]) || [];
  const estados = s.estados || {};

  const tendenciaHoy = s.tendenciaHoy || { hoy: 0, ayer: 0 };
  const estadosData = Object.entries(estados).map(([name, value]) => ({ name, value }));
  const total = s.total ?? 0;
  const gridColors = ['#4ade80','#f472b6','#60a5fa','#facc15','#a78bfa'];

  return (
    <div className="space-y-6 p-4">
      <div className="flex flex-wrap gap-6 items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin - Reportes</h1>
          <p className="text-gray-600 mt-1">Análisis históricos y métricas clave</p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/empresas" className="px-3 py-2 rounded border">Empresas</Link>
          <Link href="/dashboard/proveedores" className="px-3 py-2 rounded border">Proveedores</Link>
          <Link href="/dashboard/usuarios" className="px-3 py-2 rounded border">Usuarios</Link>
        </div>
      </div>

      {/* Entidades */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-xs font-bold uppercase text-gray-400">Total</div>
            <div className="text-2xl font-bold">{total}</div>
            <div className="text-xs text-gray-500">Solicitud(es) históricas</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-xs font-bold uppercase text-gray-400">Empresas</div>
            <div className="text-2xl font-bold">{entidades.empresas}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-xs font-bold uppercase text-gray-400">Proveedores</div>
            <div className="text-2xl font-bold">{entidades.proveedores}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-xs font-bold uppercase text-gray-400">Usuarios</div>
            <div className="text-2xl font-bold">{entidades.usuarios}</div>
          </CardContent>
        </Card>
      </div>

      {/* Distribución de estado */}
      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">Estatus de Servicios</CardTitle>
          <CardDescription>Distribución por estado</CardDescription>
        </CardHeader>
        <CardContent>
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

      {/* Distribución por tipo (Pie) */}
      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">Tipo de Auxilio</CardTitle>
          <CardDescription>Distribución por tipo</CardDescription>
        </CardHeader>
        <CardContent>
          {distribucionTipo.length > 0 ? (
            <PieChart width={400} height={260}>
              <Pie data={distribucionTipo} dataKey="cantidad" nameKey="tipo" cx="50%" cy="50%" outerRadius={80} label>
                {distribucionTipo.map((d: any, i: number) => (
                  <Cell key={i} fill={gridColors[i % gridColors.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          ) : (<div className="p-6 text-sm text-gray-500">Sin datos</div>)}
        </CardContent>
      </Card>

      {/* Tendencia (simplificado) */}
      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">Tendencia</CardTitle>
          <CardDescription>Solicitudes hoy vs ayer</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex gap-4 text-sm text-gray-700">
            <div>Hoy: {tendenciaHoy.hoy ?? 0}</div>
            <div>Ayer: {tendenciaHoy.ayer ?? 0}</div>
            <div>Diferencia: {tendenciaHoy.diferencia ?? (tendenciaHoy.hoy - tendenciaHoy.ayer)}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminReportesDashboard;
