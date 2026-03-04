"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getSolicitud,
  finalizarSolicitud,
  calificarSolicitud,
  uploadFotosSolicitud,
  deleteFotoSolicitud,
  type Solicitud,
  type EstadoSolicitud,
} from "@/lib/api-data";
import { getErrorMessage } from "@/lib/error-utils";
import { ArrowLeft, Clock, MapPin, Wrench, CheckCircle2, Star, Trash2, Camera, Image as ImageIcon, X, Plus, DollarSign } from "lucide-react";

export default function SolicitudDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  const [solicitud, setSolicitud] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);

  useEffect(() => {
    if (id) loadSolicitud();
  }, [id]);

  const loadSolicitud = async () => {
    try {
      setLoading(true);
      const data = await getSolicitud(id as string);
      setSolicitud(data);
    } catch (error) {
      toast({
        title: "Error",
        description: getErrorMessage(error, "No se pudo cargar la solicitud"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const costoFinal = Number(formData.get("costoFinal"));
    const observaciones = formData.get("observaciones") as string;

    setSubmitting(true);
    try {
      await finalizarSolicitud(id as string, { costoFinal, observaciones });
      toast({ title: "Servicio finalizado exitosamente" });
      loadSolicitud();
    } catch (error) {
      toast({
        title: "Error",
        description: getErrorMessage(error, "Error al finalizar el servicio"),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCalificar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const comentario = formData.get("comentario") as string;

    if (rating === 0) {
      toast({ title: "Por favor selecciona una calificación", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      await calificarSolicitud(id as string, { calificacion: rating, comentario });
      toast({ title: "Gracias por tu calificación" });
      loadSolicitud();
    } catch (error) {
      toast({
        title: "Error",
        description: getErrorMessage(error, "Error al calificar"),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadFotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const files = Array.from(e.target.files);

    setSubmitting(true);
    try {
      await uploadFotosSolicitud(id as string, files);
      toast({ title: "Fotos subidas con éxito" });
      loadSolicitud();
    } catch (error) {
      toast({
        title: "Error",
        description: getErrorMessage(error, "Error al subir fotos"),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteFoto = async (fotoUrl: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta foto?")) return;

    setSubmitting(true);
    try {
      await deleteFotoSolicitud(id as string, fotoUrl);
      toast({ title: "Foto eliminada" });
      loadSolicitud();
    } catch (error) {
      toast({
        title: "Error",
        description: getErrorMessage(error, "Error al eliminar foto"),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-auxy-navy" />
      </div>
    );
  }

  if (!solicitud) return <div>No encontrada</div>;

  const isOperador = user?.rol === "PROVEEDOR_OPERADOR";
  const isCliente = user?.rol === "CLIENTE_ADMIN" || user?.rol === "CLIENTE_OPERADOR";

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Button 
        variant="ghost" 
        onClick={() => router.back()}
        className="mb-2 text-gray-600 hover:text-auxy-navy"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Volver
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Columna Principal */}
        <div className="md:col-span-2 space-y-6">
          <Card className="overflow-hidden border-t-4 border-t-auxy-navy">
            <CardHeader className="bg-slate-50/50 border-b">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl font-bold flex items-center gap-2">
                    Solicitud #{solicitud.numero}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Creada el {new Date(solicitud.fechaSolicitud).toLocaleString()}
                  </CardDescription>
                </div>
                <div className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-auxy-navy text-white">
                  {solicitud.estado}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Tipo de Auxilio</p>
                  <p className="font-medium text-lg text-auxy-navy">{solicitud.tipo}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Prioridad</p>
                  <p className={`font-bold ${solicitud.prioridad === 'URGENTE' ? 'text-red-600' : 'text-orange-500'}`}>
                    {solicitud.prioridad}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-gray-500 uppercase font-semibold flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> Ubicación del Servicio
                </p>
                <div className="bg-slate-50 p-3 rounded-lg border">
                  <p className="text-sm font-medium">{solicitud.direccion}</p>
                  <p className="text-[10px] text-gray-400 font-mono mt-1">
                    LAT: {Number(solicitud.latitud).toFixed(6)} | LNG: {Number(solicitud.longitud).toFixed(6)}
                  </p>
                </div>
              </div>

              {solicitud.observaciones && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Observaciones del Pedido</p>
                  <p className="text-sm border-l-4 border-slate-200 pl-3 italic">{solicitud.observaciones}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Galería de Fotos */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-auxy-navy" /> Galería de Evidencias
                </CardTitle>
                <CardDescription>Fotos del desperfecto y del servicio realizado</CardDescription>
              </div>
              {isOperador && solicitud.estado !== "FINALIZADO" && (
                <div className="relative">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleUploadFotos}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    disabled={submitting}
                  />
                  <Button size="sm" variant="outline" className="gap-2">
                    <Camera className="h-4 w-4" /> Subir Fotos
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {solicitud.fotos && solicitud.fotos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {solicitud.fotos.map((foto: string, index: number) => (
                    <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border">
                      <img 
                        src={foto} 
                        alt={`Evidencia ${index + 1}`} 
                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                      />
                      {isOperador && solicitud.estado !== "FINALIZADO" && (
                        <button
                          onClick={() => handleDeleteFoto(foto)}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                      <a 
                        href={foto} 
                        target="_blank" 
                        rel="noreferrer"
                        className="absolute bottom-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Plus className="h-3 w-3" />
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center border-2 border-dashed rounded-lg">
                  <p className="text-sm text-gray-400">No hay fotos cargadas todavía</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Formulario de Acción */}
          {solicitud.estado === "EN_SERVICIO" && isOperador && (
            <Card className="border-purple-200 bg-purple-50/30">
              <CardHeader>
                <CardTitle className="text-purple-900 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" /> Finalizar Servicio
                </CardTitle>
                <CardDescription>Completa los datos finales para cerrar esta asistencia</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleFinalizar} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="costoFinal">Costo Final ($) *</Label>
                      <Input 
                        id="costoFinal" 
                        name="costoFinal" 
                        type="number" 
                        step="0.01" 
                        required 
                        placeholder="0.00"
                        className="border-purple-200 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="observaciones">Observaciones Técnicas (Opcional)</Label>
                    <Textarea 
                      id="observaciones" 
                      name="observaciones" 
                      placeholder="Ej: Se cambió la batería correctamente..." 
                      className="border-purple-200"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white" 
                    disabled={submitting}
                  >
                    {submitting ? "Procesando..." : "Confirmar Cierre de Servicio"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {solicitud.estado === "FINALIZADO" && isCliente && !solicitud.calificacion && (
            <Card className="border-yellow-200 bg-yellow-50/30">
              <CardHeader>
                <CardTitle className="text-yellow-900 flex items-center gap-2">
                  <Star className="h-5 w-5" /> Calificar Servicio
                </CardTitle>
                <CardDescription>Tu opinión nos ayuda a mejorar la red de auxilio</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCalificar} className="space-y-6 text-center">
                  <div className="flex justify-center gap-4">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setRating(s)}
                        className={`transition-transform hover:scale-125 ${rating >= s ? 'text-yellow-500' : 'text-gray-300'}`}
                      >
                        <Star className="h-10 w-10 fill-current" />
                      </button>
                    ))}
                  </div>
                  <div className="space-y-2 text-left">
                    <Label htmlFor="comentario">Comentario (Opcional)</Label>
                    <Textarea 
                      id="comentario" 
                      name="comentario" 
                      placeholder="Contanos tu experiencia..." 
                      className="border-yellow-200"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold" 
                    disabled={submitting}
                  >
                    {submitting ? "Enviando..." : "Enviar Calificación"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {solicitud.calificacion > 0 && (
            <Card className="bg-green-50/50 border-green-100">
               <CardHeader>
                 <CardTitle className="text-sm font-bold text-green-800 flex items-center gap-2">
                   Calificación recibida: {solicitud.calificacion} / 5
                 </CardTitle>
               </CardHeader>
               {solicitud.comentarioCliente && (
                 <CardContent>
                   <p className="text-sm italic text-gray-600">"{solicitud.comentarioCliente}"</p>
                 </CardContent>
               )}
            </Card>
          )}
        </div>

        {/* Columna Lateral - Detalles de Recursos */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold uppercase text-gray-500">Recursos Asignados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-auxy-navy mt-1" />
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase">Tiempos</p>
                    <ul className="text-xs space-y-1.5 mt-1">
                      {solicitud.fechaAsignacion && (
                        <li><span className="text-gray-500">Asignada:</span> {new Date(solicitud.fechaAsignacion).toLocaleTimeString()}</li>
                      )}
                      {solicitud.fechaInicio && (
                        <li><span className="text-gray-500">En camino:</span> {new Date(solicitud.fechaInicio).toLocaleTimeString()}</li>
                      )}
                      {solicitud.fechaFinalizacion && (
                        <li><span className="text-gray-500">Finalizada:</span> {new Date(solicitud.fechaFinalizacion).toLocaleTimeString()}</li>
                      )}
                    </ul>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Wrench className="h-4 w-4 text-auxy-navy mt-1" />
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase">Personal y Unidad</p>
                    <div className="mt-2 space-y-3">
                      <div>
                        <p className="text-[10px] text-gray-500">Operador:</p>
                        <p className="text-sm font-medium">{solicitud.atendidoPor ? `${solicitud.atendidoPor.nombre} ${solicitud.atendidoPor.apellido}` : 'Sin asignar'}</p>
                      </div>
                      {solicitud.vehiculoProveedor && (
                        <div>
                          <p className="text-[10px] text-gray-500">Unidad de Auxilio:</p>
                          <p className="text-sm font-medium">{solicitud.vehiculoProveedor.marca} {solicitud.vehiculoProveedor.modelo}</p>
                          <p className="text-xs font-mono text-auxy-navy bg-slate-100 w-fit px-1">{solicitud.vehiculoProveedor.patente}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Costo del Servicio */}
          {(solicitud.estado === "FINALIZADO" || solicitud.estado === "CANCELADO") && solicitud.costoFinal !== undefined && solicitud.costoFinal !== null && (
            <Card className={solicitud.estado === "CANCELADO" ? "border-red-200 bg-red-50/30" : "border-green-200 bg-green-50/30"}>
              <CardHeader className="pb-2">
                <CardTitle className={`text-sm font-semibold uppercase flex items-center gap-2 ${solicitud.estado === "CANCELADO" ? "text-red-700" : "text-green-700"}`}>
                  <DollarSign className="h-4 w-4" />
                  {solicitud.estado === "CANCELADO" ? "Servicio Cancelado" : "Costo del Servicio"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Monto final:</span>
                  <span className={`text-2xl font-bold ${solicitud.estado === "CANCELADO" ? "text-red-600" : "text-green-600"}`}>
                    ${Number(solicitud.costoFinal).toFixed(2)}
                  </span>
                </div>
                {solicitud.observaciones && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500 uppercase font-semibold">Observaciones:</p>
                    <p className="text-sm mt-1">{solicitud.observaciones}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold uppercase text-gray-500">Vehículo del Cliente</CardTitle>
            </CardHeader>
            <CardContent>
              {solicitud.vehiculo ? (
                <div className="space-y-2">
                  <div className="flex justify-between items-end border-b pb-2">
                    <div>
                      <p className="text-lg font-bold text-auxy-navy">{solicitud.vehiculo.patente}</p>
                      <p className="text-sm text-gray-600">{solicitud.vehiculo.marca} {solicitud.vehiculo.modelo}</p>
                    </div>
                  </div>
                  <div className="pt-2">
                    <p className="text-[10px] text-gray-400">EMPRESA:</p>
                    <p className="text-xs font-medium">{solicitud.empresa?.razonSocial}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400">Sin datos del vehículo</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
