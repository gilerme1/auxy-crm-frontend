"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getSolicitudes, type Solicitud } from "@/lib/api-data";
import Link from "next/link";
import { Activity, Truck, CheckCircle2, ChevronRight } from "lucide-react";

export function OperadorProveedorDashboard() {
  const { user } = useAuth();
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadSolicitudes(); }, []);

  const loadSolicitudes = async () => {
    try {
      const data = await getSolicitudes();
      setSolicitudes(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error loading solicitudes:", e);
    } finally {
      setLoading(false);
    }
  };

  const misAsignadas = solicitudes.filter(s => s.atendidoPor?.id === user?.id && ["ASIGNADO","EN_CAMINO","EN_SERVICIO"].includes(s.estado));
  const misFinalizadas = solicitudes.filter(s => s.atendidoPor?.id === user?.id && s.estado === "FINALIZADO");
  const pendientesMarketplace = solicitudes.filter(s => s.estado === "PENDIENTE");

  const kpis = [
    { label: "Mis servicios activos", value: misAsignadas.length, icon: Activity, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Mis servicios finalizados", value: misFinalizadas.length, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
    { label: "Marketplace pendientes", value: pendientesMarketplace.length, icon: Truck, color: "text-sky-700", bg: "bg-slate-100" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Bienvenido, {user?.nombre}</h1>
          <p className="text-gray-600 mt-1 italic">Tus servicios y marketplace</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {kpis.map((k, idx) => (
          <Card key={idx} className="shadow-sm border-t" >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase text-gray-400">{k.label}</p>
                  <div className="text-2xl font-bold text-gray-900 mt-1">{k.value}</div>
                </div>
                <div className={`p-3 rounded-xl ${k.bg}`}>
                  <k.icon className={`h-5 w-5 ${k.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2"><Activity className="h-4 w-4"/> Mis servicios activos</CardTitle>
          <CardDescription>Servicios asignados a ti</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {misAsignadas.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">Sin servicios activos</div>
          ) : (
            misAsignadas.map((s) => (
              <div key={s.id} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-gray-400">#{s.numero}</span>
                  <span>{s.tipo}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${s.estado === 'EN_SERVICIO' ? 'bg-blue-100' : 'bg-slate-100'}`}>{s.estado}</span>
                </div>
                <Link href={`/dashboard/solicitudes/${s.id}`}><ChevronRight className="h-3 w-3"/></Link>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-500">Marketplace</CardTitle>
          <CardDescription>Solicitudes pendientes para tomar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {pendientesMarketplace.length === 0 ? (
            <div className="text-center py-4 text-gray-400 text-sm">Ninguna pendiente</div>
          ) : pendientesMarketplace.slice(0,5).map((s) => (
            <div key={s.id} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <span className="text-sm">{s.tipo}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${s.prioridad === 'URGENTE' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-700'}`}>{s.prioridad}</span>
              </div>
              <Link href={`/dashboard/solicitudes/${s.id}`}><ChevronRight className="h-3 w-3" /></Link>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
