"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { notify } from "@/lib/notifier";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  getSolicitudes,
  createSolicitud,
  cancelarSolicitud,
  getVehiculos,
  getUsuarios,
  getVehiculosProveedor,
  aceptarSolicitud,
  cambiarEstadoSolicitud,
  type Solicitud,
  type Vehiculo,
  type TipoAuxilio,
  type Prioridad,
  type EstadoSolicitud,
} from "@/lib/api-data";
import { getErrorMessage, isNetworkConnectionError } from "@/lib/error-utils";
import { MapSelector } from "@/components/maps";

const ESTADO_COLORS: Record<string, string> = {
  PENDIENTE: "bg-yellow-100 text-yellow-800",
  ASIGNADO: "bg-blue-100 text-blue-800",
  EN_CAMINO: "bg-indigo-100 text-indigo-800",
  EN_SERVICIO: "bg-purple-100 text-purple-800",
  FINALIZADO: "bg-green-100 text-green-800",
  CANCELADO: "bg-red-100 text-red-800",
};

const PRIORIDAD_COLORS: Record<string, string> = {
  BAJA: "bg-gray-100 text-gray-700",
  MEDIA: "bg-yellow-100 text-yellow-700",
  ALTA: "bg-orange-100 text-orange-700",
  URGENTE: "bg-red-100 text-red-700",
};

const TIPOS_AUXILIO: { value: TipoAuxilio; label: string }[] = [
  { value: "MECANICO", label: "Mecánico" },
  { value: "GRUA", label: "Grúa" },
  { value: "BATERIA", label: "Batería" },
  { value: "COMBUSTIBLE", label: "Combustible" },
  { value: "CAMBIO_RUEDA", label: "Cambio de Rueda" },
  { value: "CERRAJERIA", label: "Cerrajería" },
  { value: "OTROS", label: "Otros" },
];

const PRIORIDADES: { value: Prioridad; label: string }[] = [
  { value: "BAJA", label: "Baja" },
  { value: "MEDIA", label: "Media" },
  { value: "ALTA", label: "Alta" },
  { value: "URGENTE", label: "Urgente" },
];

export default function SolicitudesPage() {
  const { user, loading: authLoading } = useAuth();

  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [motivoCancelacion, setMotivoCancelacion] = useState("");
  const [dataLoaded, setDataLoaded] = useState(false);

  // Aceptar Dialog state
  const [isAceptarOpen, setIsAceptarOpen] = useState(false);
  const [solicitudToAceptar, setSolicitudToAceptar] = useState<Solicitud | null>(null);
  const [operadoresParaDelegar, setOperadoresParaDelegar] = useState<any[]>([]);
  const [vehiculosParaDelegar, setVehiculosParaDelegar] = useState<any[]>([]);
  const [selectedOperadorId, setSelectedOperadorId] = useState<string>("");
  const [selectedVehiculoId, setSelectedVehiculoId] = useState<string>("");

  // Form state for map integration
  const [formLocation, setFormLocation] = useState<{ lat: number; lng: number; address: string }>({
    lat: -34.6037,
    lng: -58.3816,
    address: ""
  });

  const isCliente = user?.rol === "CLIENTE_ADMIN" || user?.rol === "CLIENTE_OPERADOR";
  const isProveedor = user?.rol === "PROVEEDOR_ADMIN" || user?.rol === "PROVEEDOR_OPERADOR";
  const isSuperAdmin = user?.rol === "SUPER_ADMIN";

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    if (dataLoaded) return;

    loadSolicitudes();
    if (isCliente) loadVehiculos();
    setDataLoaded(true);
  }, [authLoading, user, dataLoaded, isCliente]);

  const loadSolicitudes = async () => {
    try {
      setLoading(true);
      const data = await getSolicitudes();
      setSolicitudes(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error("Error cargando solicitudes:", error);
      if (!isNetworkConnectionError(error)) {
        notify({
          title: "Error",
          description: getErrorMessage(error, "No se pudieron cargar las solicitudes"),
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const loadVehiculos = async () => {
    try {
      const data = await getVehiculos();
      setVehiculos(Array.isArray(data) ? data : []);
    } catch {
      // silently fail — vehiculos aren't critical for the page to render
    }
  };

  const handleCreateSolicitud = async (formData: FormData) => {
    setIsSubmitting(true);
    try {
      const tipo = formData.get("tipo") as TipoAuxilio;
      const prioridad = formData.get("prioridad") as Prioridad;
      const vehiculoId = formData.get("vehiculoId") as string;
      const direccion = formData.get("direccion") as string || formLocation.address;
      const latitud = formLocation.lat;
      const longitud = formLocation.lng;
      const observaciones = formData.get("observaciones") as string;

      if (!tipo || !vehiculoId || !direccion) {
        notify({ title: "Completa todos los campos obligatorios", variant: "destructive" });
        return;
      }

      await createSolicitud({
        tipo,
        prioridad,
        vehiculoId,
        latitud,
        longitud,
        direccion,
        observaciones: observaciones || undefined,
      });

      notify({ title: "Solicitud creada exitosamente" });
      setIsDialogOpen(false);
      setFormLocation({ lat: -34.6037, lng: -58.3816, address: "" });
      await loadSolicitudes();
    } catch (error: any) {
      console.error("Error al crear solicitud:", error);
      notify({
        title: "Error al crear solicitud",
        description: getErrorMessage(error, "Error al crear solicitud"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCambiarEstado = async (id: string, nuevoEstado: EstadoSolicitud) => {
    try {
      await cambiarEstadoSolicitud(id, nuevoEstado);
      notify({ title: `Estado actualizado a ${nuevoEstado}` });
      await loadSolicitudes();
    } catch (error: any) {
      notify({
        title: "Error al cambiar estado",
        description: getErrorMessage(error, "No se pudo actualizar el estado"),
        variant: "destructive",
      });
    }
  };

  const handleAceptarSolicitud = async (id: string) => {
    const solicitud = solicitudes.find(s => s.id === id);
    if (!solicitud) return;

    if (user?.rol === "PROVEEDOR_ADMIN") {
      try {
        setLoading(true);
        const [ops, vehs] = await Promise.all([getUsuarios(), getVehiculosProveedor()]);

        const validOps = Array.isArray(ops) ? ops : [];
        setOperadoresParaDelegar(validOps);
        setVehiculosParaDelegar(Array.isArray(vehs) ? vehs : []);

        setSelectedOperadorId(user.id);
        const currentOp = validOps.find((o: any) => o.id === user.id);
        setSelectedVehiculoId(currentOp?.vehiculoProveedorId || "ninguno");

        setSolicitudToAceptar(solicitud);
        setIsAceptarOpen(true);
      } catch (error) {
        notify({ title: "Error", description: "No se pudieron cargar los recursos para delegar", variant: "destructive" });
      } finally {
        setLoading(false);
      }
      return;
    }

    // Operador acepta directamente
    try {
      await aceptarSolicitud(id);
      notify({ title: "Solicitud tomada exitosamente", description: "Ahora puedes gestionar este servicio." });
      await loadSolicitudes();
    } catch (error: any) {
      console.error("Error al aceptar solicitud:", error);
      notify({
        title: "Error",
        description: getErrorMessage(error, "No se pudo tomar la solicitud"),
        variant: "destructive",
      });
    }
  };

  const handleConfirmarAceptarConDelegacion = async (formData: FormData) => {
    if (!solicitudToAceptar) return;

    const operadorId = formData.get("operadorId") as string;
    const vehiculoProveedorId = formData.get("vehiculoProveedorId") as string;

    setIsSubmitting(true);
    try {
      await aceptarSolicitud(solicitudToAceptar.id, {
        operadorId: operadorId !== "ninguno" ? operadorId : undefined,
        vehiculoProveedorId: vehiculoProveedorId !== "ninguno" ? vehiculoProveedorId : undefined
      });

      notify({ title: "Solicitud delegada exitosamente" });
      setIsAceptarOpen(false);
      setSolicitudToAceptar(null);
      await loadSolicitudes();
    } catch (error: any) {
      notify({
        title: "Error al delegar",
        description: getErrorMessage(error, "Error al delegar la solicitud"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelar = async () => {
    if (!cancelId || !motivoCancelacion.trim()) {
      notify({ title: "Ingresa un motivo de cancelación", variant: "destructive" });
      return;
    }
    try {
      await cancelarSolicitud(cancelId, motivoCancelacion);
      notify({ title: "Solicitud cancelada" });
      setCancelId(null);
      setMotivoCancelacion("");
      await loadSolicitudes();
    } catch (error: any) {
      console.error("Error al cancelar:", error);
      notify({
        title: "Error al cancelar",
        description: getErrorMessage(error, "Error al cancelar"),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 max-w-full">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isCliente ? "Solicitudes de Auxilio" : isSuperAdmin ? "Todas las Solicitudes" : "Solicitudes de Servicio"}
          </h1>
          <p className="text-gray-600 mt-1">
            {isCliente
              ? "Crea y gestiona solicitudes para tus vehículos"
              : isSuperAdmin
              ? "Visión global de todas las solicitudes"
              : "Mira las solicitudes disponibles o asignadas"}
          </p>
        </div>

        {isCliente && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-auxy-red hover:bg-red-700 text-white">
                + Nueva Solicitud
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Crear Solicitud de Auxilio</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); handleCreateSolicitud(new FormData(e.currentTarget)); }} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="tipo">Tipo de Auxilio *</Label>
                    <select
                      id="tipo"
                      name="tipo"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      required
                    >
                      <option value="">Seleccionar tipo</option>
                      {TIPOS_AUXILIO.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="prioridad">Prioridad</Label>
                    <select
                      id="prioridad"
                      name="prioridad"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      {PRIORIDADES.map(p => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="vehiculoId">Vehículo *</Label>
                  <select
                    id="vehiculoId"
                    name="vehiculoId"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    required
                  >
                    <option value="">Seleccionar vehículo</option>
                    {vehiculos.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.patente} — {v.marca} {v.modelo}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="direccion">Dirección *</Label>
                  <Input id="direccion" name="direccion" placeholder="Ej: Corrientes 1234, CABA" required
                    value={formLocation.address}
                    onChange={(e) => setFormLocation(prev => ({ ...prev, address: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Ubicación exacta *</Label>
                  <MapSelector
                    onLocationChange={(lat, lng, address) => {
                      setFormLocation(prev => ({
                        lat,
                        lng,
                        address: address || prev.address
                      }));
                    }}
                    className="h-[300px] w-full rounded-md border overflow-hidden"
                  />
                  <div className="flex gap-4 text-[10px] text-muted-foreground uppercase font-mono">
                    <span>Lat: {formLocation.lat.toFixed(6)}</span>
                    <span>Lon: {formLocation.lng.toFixed(6)}</span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="observaciones">Observaciones</Label>
                  <Input id="observaciones" name="observaciones" placeholder="El auto no arranca..." />
                </div>

                <Button type="submit" className="w-full bg-auxy-navy hover:bg-slate-800 text-white" disabled={isSubmitting}>
                  {isSubmitting ? "Creando..." : "Crear Solicitud"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Cancel Modal */}
      {cancelId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm space-y-4">
            <h3 className="font-bold text-lg">Cancelar Solicitud</h3>
            <div>
              <Label htmlFor="motivo">Motivo *</Label>
              <Input
                id="motivo"
                value={motivoCancelacion}
                onChange={(e) => setMotivoCancelacion(e.target.value)}
                placeholder="Motivo de cancelación"
              />
            </div>
            <div className="flex gap-2">
              <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={handleCancelar}>
                Confirmar
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => { setCancelId(null); setMotivoCancelacion(""); }}>
                Volver
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Aceptar / Delegar Dialog */}
      <Dialog open={isAceptarOpen} onOpenChange={setIsAceptarOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aceptar y delegar servicio</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleConfirmarAceptarConDelegacion(new FormData(e.currentTarget)); }} className="space-y-4">
            <div className="text-sm text-gray-600 space-y-1 bg-blue-50 p-3 rounded-md border border-blue-100">
              <p>Al confirmar aceptas la solicitud: <strong>{solicitudToAceptar?.numero}</strong></p>
              <p>Tipo de auxilio: <strong>{TIPOS_AUXILIO.find(t => t.value === solicitudToAceptar?.tipo)?.label || solicitudToAceptar?.tipo}</strong></p>
              <p className="text-xs text-amber-700 font-medium mt-2">⚠️ Debes asignársela a un vehículo que cumpla el auxilio requerido.</p>
            </div>

            <div>
              <Label htmlFor="operadorId">Conductor Responsable</Label>
              <select
                id="operadorId"
                name="operadorId"
                value={selectedOperadorId}
                onChange={(e) => {
                  const opId = e.target.value;
                  setSelectedOperadorId(opId);
                  const op = operadoresParaDelegar.find(o => o.id === opId);
                  setSelectedVehiculoId(op?.vehiculoProveedorId || "ninguno");
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="ninguno">Sin asignar responsable específico</option>
                {operadoresParaDelegar.map((op) => (
                  <option key={op.id} value={op.id}>
                    {op.nombre} {op.apellido} ({op.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="vehiculoProveedorId">Vehículo / Grúa</Label>
              <select
                id="vehiculoProveedorId"
                name="vehiculoProveedorId"
                value={selectedVehiculoId}
                onChange={(e) => setSelectedVehiculoId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="ninguno">Sin vehículo asignado</option>
                {vehiculosParaDelegar.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.marca} {v.modelo} - {v.patente} ({v.tipos?.join(', ')})
                  </option>
                ))}
              </select>
            </div>

            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white" disabled={isSubmitting}>
              {isSubmitting ? "Procesando..." : "Confirmar y Aceptar"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Card className="w-full max-w-full">
        <CardHeader>
          <CardTitle>Solicitudes</CardTitle>
          <CardDescription>
            {loading ? "Cargando..." : `${solicitudes.length} solicitud(es) encontrada(s)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
            </div>
          ) : solicitudes.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500 text-lg">No hay solicitudes aún</p>
              {isCliente && (
                <p className="text-gray-400 text-sm mt-1">Crea tu primera solicitud con el botón de arriba</p>
              )}
            </div>
          ) : (
            <div className="w-full max-w-full">
              <table className="w-full table-fixed text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium text-gray-600">N°</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600">Tipo</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600">Estado</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600">Prioridad</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600">Dirección</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600">Vehículo Cliente</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600">Asignado a</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600">Auxilio</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600">Fecha</th>
                    <th className="py-2 px-3" />
                  </tr>
                </thead>
                <tbody>
                  {solicitudes.map((s) => (
                    <tr key={s.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="py-2 px-3 font-mono text-xs break-all">{s.numero}</td>
                      <td className="py-2 px-3">
                        {TIPOS_AUXILIO.find((t) => t.value === s.tipo)?.label ?? s.tipo}
                      </td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${ESTADO_COLORS[s.estado]}`}>
                          {s.estado}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${PRIORIDAD_COLORS[s.prioridad]}`}>
                          {s.prioridad}
                        </span>
                      </td>
                      <td className="py-2 px-3 wrap-break-word" title={s.direccion}>
                        {s.direccion}
                      </td>
                      <td className="py-2 px-3">
                        {s.vehiculo ? `${s.vehiculo.patente}` : "—"}
                      </td>
                      <td className="py-2 px-3">
                        {s.atendidoPor ? `${s.atendidoPor.nombre} ${s.atendidoPor.apellido}` : "—"}
                      </td>
                      <td className="py-2 px-3">
                        {s.vehiculoProveedor ? `${s.vehiculoProveedor.patente}` : "—"}
                      </td>
                      <td className="py-2 px-3 text-gray-500">
                        {new Date(s.fechaSolicitud).toLocaleDateString("es-AR")}
                      </td>
                      <td className="py-2 px-3 text-right align-top">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Link href={`/dashboard/solicitudes/${s.id}`}>
                            <Button size="sm" variant="ghost" className="text-gray-500">
                              Ver
                            </Button>
                          </Link>

                          {isCliente && (s.estado === "PENDIENTE" || s.estado === "ASIGNADO") && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => setCancelId(s.id)}
                            >
                              Cancelar
                            </Button>
                          )}

                          {isProveedor && s.estado === "PENDIENTE" && (
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => handleAceptarSolicitud(s.id)}
                            >
                              Aceptar
                            </Button>
                          )}

                          {/* ✅ ASIGNADO: solo el operador asignado puede iniciar viaje */}
                          {isProveedor && s.estado === "ASIGNADO" && (
                            s.atendidoPor?.id === user?.id ? (
                              <Button
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                onClick={() => handleCambiarEstado(s.id, "EN_CAMINO")}
                              >
                                Iniciar Viaje
                              </Button>
                            ) : (
                              <span className="text-xs text-gray-400 italic px-1 self-center">
                                Asignado a {s.atendidoPor
                                  ? `${s.atendidoPor.nombre} ${s.atendidoPor.apellido}`
                                  : "otro operador"}
                              </span>
                            )
                          )}

                          {/* ✅ EN_CAMINO: solo el operador asignado puede marcar llegada */}
                          {isProveedor && s.estado === "EN_CAMINO" && s.atendidoPor?.id === user?.id && (
                            <Button
                              size="sm"
                              className="bg-indigo-600 hover:bg-indigo-700 text-white"
                              onClick={() => handleCambiarEstado(s.id, "EN_SERVICIO")}
                            >
                              Llegué al Lugar
                            </Button>
                          )}

                          {/* ✅ EN_SERVICIO: solo el operador asignado puede finalizar */}
                          {isProveedor && s.estado === "EN_SERVICIO" && s.atendidoPor?.id === user?.id && (
                            <Link href={`/dashboard/solicitudes/${s.id}`}>
                              <Button
                                size="sm"
                                className="bg-purple-600 hover:bg-purple-700 text-white"
                              >
                                Finalizar
                              </Button>
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
