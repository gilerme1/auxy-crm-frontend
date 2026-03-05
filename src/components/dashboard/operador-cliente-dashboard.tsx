"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getSolicitudes, type Solicitud } from "@/lib/api-data";
import Link from "next/link";
import { Activity, CheckCircle2, ClipboardList, Plus, ChevronRight } from "lucide-react";

export function OperadorClienteDashboard() {
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

  const userId = user?.id;
  const misSolicitudes = solicitudes.filter(s => {
    const solicitado = s.solicitadoPor as any;
    return solicitado?.id === userId;
  });

  const misActivas = misSolicitudes.filter(s => 
    ["PENDIENTE", "ASIGNADO", "EN_CAMINO", "EN_SERVICIO"].includes(s.estado)
  );
  const misFinalizadas = misSolicitudes.filter(s => s.estado === "FINALIZADO");
  const recientes = misSolicitudes.slice(0, 5);
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-56 bg-slate-100 animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1,2,3].map((i) => (
            <div key={i} className="h-28 bg-slate-100 animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Bienvenido, {user?.nombre}</h1>
          <p className="text-gray-600 mt-1 italic">Tus solicitudes de auxilio (operador)</p>
        </div>
        <Link href="/dashboard/solicitudes"><button className="px-4 py-2 bg-auxy-red text-white rounded">Nueva Solicitud</button></Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Mis solicitudes activas", value: misActivas.length, icon: Activity },
          { label: "Mis servicios finalizados", value: misFinalizadas.length, icon: CheckCircle2 },
          { label: "Mis solicitudes totales", value: misSolicitudes.length, icon: ClipboardList }
        ].map((k, idx) => (
          <Card key={idx} className="shadow-sm border-t" >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase text-gray-400">{k.label}</p>
                  <div className="text-2xl font-bold text-gray-900 mt-1">{k.value}</div>
                </div>
                <k.icon className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mis últimas solicitudes</CardTitle>
          <CardDescription>Historial personal — últimas 5</CardDescription>
        </CardHeader>
        <CardContent className="divide-y">
          {recientes.length === 0 ? (
            <div className="text-center py-8 text-gray-400">Sin solicitudes</div>
          ) : (
            recientes.map((s) => (
              <div key={s.id} className="flex items-center justify-between py-2">
                <div>
                  <span className="font-mono text-xs text-gray-500">#{s.numero}</span> <span className="font-medium">{s.tipo}</span>
                </div>
                <Link href={`/dashboard/solicitudes/${s.id}`}><ChevronRight className="h-3 w-3" /></Link>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
