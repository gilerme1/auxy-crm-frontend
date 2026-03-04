"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
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
  createVehiculo,
  getVehiculos,
  createVehiculoProveedor,
  getVehiculosProveedor,
  updateVehiculo,
  deleteVehiculo,
  updateVehiculoProveedor,
  deleteVehiculoProveedor,
  type Vehiculo,
  type TipoVehiculo,
  type TipoVehiculoProveedor,
} from "@/lib/api-data";
import { getErrorMessage, isNetworkConnectionError } from "@/lib/error-utils";

const TIPOS_VEHICULO_EMPRESA: { value: TipoVehiculo; label: string }[] = [
  { value: "AUTO", label: "Auto" },
  { value: "CAMIONETA", label: "Camioneta" },
  { value: "CAMION", label: "Camión" },
  { value: "MOTO", label: "Moto" },
  { value: "OTRO", label: "Otro" },
];

const TIPOS_VEHICULO_PROVEEDOR: { value: TipoVehiculoProveedor; label: string }[] = [
  { value: "GRUA_PESADA_CAMIONES", label: "Grúa Pesada (Camiones)" },
  { value: "REMOLQUE", label: "Remolque / Grúa Liviana" },
  { value: "MECANICA", label: "Mecánica" },
  { value: "CERRAJERIA", label: "Cerrajería" },
  { value: "GOMERIA_NEUMATICOS", label: "Gomería / Neumáticos" },
  { value: "OTRO", label: "Otro" },
];

export default function VehiculosPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingVehiculo, setEditingVehiculo] = useState<Vehiculo | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    if (dataLoaded) return;
    
    loadVehiculos();
    setDataLoaded(true);
  }, [authLoading, user, dataLoaded]);

  useEffect(() => {
    if (user) {
      setDataLoaded(false);
    }
  }, [user?.id]);

  const isCliente = user?.rol === "CLIENTE_ADMIN" || user?.rol === "CLIENTE_OPERADOR";
  const isProveedor = user?.rol === "PROVEEDOR_ADMIN" || user?.rol === "PROVEEDOR_OPERADOR";
  const isSuperAdmin = user?.rol === "SUPER_ADMIN";
  const isAdmin = user?.rol === "CLIENTE_ADMIN" || user?.rol === "PROVEEDOR_ADMIN" || isSuperAdmin;

  const loadVehiculos = async () => {
    if (!user) return;
    try {
      setLoading(true);

      if (isCliente) {
        if (!user.empresaId) {
          toast({
            title: "Sin empresa asignada",
            description: "Tu cuenta no tiene empresa. Contacta al administrador.",
            variant: "destructive",
          });
          setVehiculos([]);
          return;
        }
        const data = await getVehiculos();
        setVehiculos(Array.isArray(data) ? data : []);
      } else if (isProveedor) {
        if (!user.proveedorId) {
          toast({
            title: "Sin proveedor asignado",
            description: "Tu cuenta no tiene proveedor. Contacta al administrador.",
            variant: "destructive",
          });
          setVehiculos([]);
          return;
        }
        const data = await getVehiculosProveedor();
        setVehiculos(Array.isArray(data) ? data : []);
      } else if (isSuperAdmin) {
        // SUPER_ADMIN can see all — backend returns all for SUPER_ADMIN
        const data = await getVehiculos();
        setVehiculos(Array.isArray(data) ? data : []);
      }
    } catch (error: any) {
      console.error("Error cargando vehículos:", error);
      if (!isNetworkConnectionError(error)) {
        toast({
          title: "Error",
          description: getErrorMessage(error, "No se pudieron cargar los vehículos"),
          variant: "destructive",
        });
      }
      setVehiculos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVehiculo = async (formData: FormData) => {
    setIsSubmitting(true);
    try {
      const patente = (formData.get("patente") as string).toUpperCase().trim();
      const marca = formData.get("marca") as string;
      const modelo = formData.get("modelo") as string;
      const año = parseInt(formData.get("año") as string);
      
      const tipos = isProveedor 
        ? formData.getAll("tipos") as TipoVehiculoProveedor[]
        : [formData.get("tipo") as TipoVehiculo];

      if (!patente || patente.length < 6) {
        toast({ title: "Patente inválida", description: "Mínimo 6 caracteres", variant: "destructive" });
        return;
      }
      if (isNaN(año) || año < 1900) {
        toast({ title: "Año inválido", variant: "destructive" });
        return;
      }

      if (isCliente || isSuperAdmin) {
        const empresaId = isCliente ? user!.empresaId! : (formData.get("empresaId") as string);
        if (!empresaId) {
          toast({ title: "Falta empresaId", description: "Ingresa el ID de empresa", variant: "destructive" });
          return;
        }
        await createVehiculo({
          patente,
          marca,
          modelo,
          año,
          tipo: tipos[0] as TipoVehiculo,
          empresaId,
        });
      } else if (isProveedor) {
        if (!user?.proveedorId) throw new Error("Sin proveedor asignado");
        await createVehiculoProveedor({
          patente,
          marca,
          modelo,
          año,
          tipos: tipos as TipoVehiculoProveedor[],
          proveedorId: user.proveedorId,
        });
      }

      toast({ title: "Vehículo registrado", description: `Patente ${patente}` });
      setIsDialogOpen(false);
      await loadVehiculos();
    } catch (error: any) {
      console.error("Error al registrar vehículo:", error);
      toast({
        title: "Error al registrar",
        description: getErrorMessage(error, "No se pudo registrar el vehículo"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateVehiculo = async (formData: FormData) => {
    if (!editingVehiculo) return;
    setIsSubmitting(true);
    try {
      const patente = (formData.get("patente") as string).toUpperCase().trim();
      const marca = formData.get("marca") as string;
      const modelo = formData.get("modelo") as string;
      const año = parseInt(formData.get("año") as string);
      
      const tipos = isProveedor 
        ? formData.getAll("tipos") as TipoVehiculoProveedor[]
        : [formData.get("tipo") as TipoVehiculo];

      const payload: any = { patente, marca, modelo, año };
      if (isProveedor) payload.tipos = tipos;
      else payload.tipo = tipos[0];

      if (isProveedor) {
        await updateVehiculoProveedor(editingVehiculo.id, payload);
      } else {
        await updateVehiculo(editingVehiculo.id, payload);
      }

      toast({ title: "Vehículo actualizado", description: `Patente ${patente}` });
      setIsEditOpen(false);
      setEditingVehiculo(null);
      await loadVehiculos();
    } catch (error: any) {
      console.error("Error al actualizar vehículo:", error);
      toast({
        title: "Error al actualizar",
        description: getErrorMessage(error, "No se pudo actualizar el vehículo"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteVehiculo = async (id: string, patente: string) => {
    if (!confirm(`¿Estás seguro de eliminar el vehículo con patente ${patente}?`)) return;
    
    try {
      if (isProveedor) {
        await deleteVehiculoProveedor(id);
      } else {
        await deleteVehiculo(id);
      }
      toast({ title: "Vehículo eliminado", description: `Patente ${patente}` });
      await loadVehiculos();
    } catch (error: any) {
      console.error("Error al eliminar vehículo:", error);
      toast({
        title: "Error",
        description: getErrorMessage(error, "No se pudo eliminar el vehículo"),
        variant: "destructive",
      });
    }
  };

  const tiposDisponibles = isProveedor ? TIPOS_VEHICULO_PROVEEDOR : TIPOS_VEHICULO_EMPRESA;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {isCliente ? "Flota de Vehículos" : isProveedor ? "Vehículos de Auxilio" : "Todos los Vehículos"}
        </h1>
        <p className="text-gray-600 mt-1">
          {isAdmin ? "Gestiona los vehículos" : "Visualiza los vehículos disponibles"}
        </p>
      </div>

      {isAdmin && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>+ Registrar Vehículo</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isCliente ? "Registrar Vehículo de Flota" : isProveedor ? "Registrar Vehículo de Auxilio" : "Registrar Vehículo"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); handleAddVehiculo(new FormData(e.currentTarget)); }} className="space-y-4">
              <div>
                <Label htmlFor="patente">Patente</Label>
                <Input id="patente" name="patente" placeholder="ABC 1234" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="marca">Marca</Label>
                  <Input id="marca" name="marca" placeholder="Toyota" required />
                </div>
                <div>
                  <Label htmlFor="modelo">Modelo</Label>
                  <Input id="modelo" name="modelo" placeholder="Corolla" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="año">Año</Label>
                  <Input
                    id="año"
                    name="año"
                    type="number"
                    placeholder="2024"
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    required
                  />
                </div>
                {!isProveedor && (
                  <div>
                    <Label htmlFor="tipo">Tipo</Label>
                    <select
                      id="tipo"
                      name="tipo"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Seleccionar...</option>
                      {TIPOS_VEHICULO_EMPRESA.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              
              {isProveedor && (
                <div className="space-y-2">
                  <Label>Servicios / Tipos</Label>
                  <div className="grid grid-cols-2 gap-2 p-3 border rounded-md">
                    {TIPOS_VEHICULO_PROVEEDOR.map((t) => (
                      <div key={t.value} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`tipo-${t.value}`}
                          name="tipos"
                          value={t.value}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`tipo-${t.value}`} className="text-xs text-gray-700 cursor-pointer">
                          {t.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isSuperAdmin && !isCliente && (
                <div>
                  <Label htmlFor="empresaId">ID de Empresa (UUID)</Label>
                  <Input id="empresaId" name="empresaId" placeholder="uuid de la empresa" required />
                </div>
              )}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Registrando..." : "Registrar Vehículo"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Listado de Vehículos</CardTitle>
          <CardDescription>
            {loading ? "Cargando..." : `${vehiculos.length} vehículo(s) encontrado(s)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
            </div>
          ) : vehiculos.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">
                {isAdmin ? "Registra tu primer vehículo" : "No hay vehículos registrados"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium text-gray-600">Patente</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600">Marca / Modelo</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600">Año</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600">Tipo</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600">Registrado</th>
                    {isAdmin && <th className="text-right py-2 px-3 font-medium text-gray-600">Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {vehiculos.map((v) => (
                    <tr key={v.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="py-2 px-3 font-semibold">{v.patente}</td>
                      <td className="py-2 px-3">{v.marca} {v.modelo}</td>
                      <td className="py-2 px-3">{v.año}</td>
                      <td className="py-2 px-3">
                        <div className="flex flex-wrap gap-1">
                          {v.tipo && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-[10px] font-medium uppercase">
                              {v.tipo}
                            </span>
                          )}
                          {v.tipos?.map((t) => (
                            <span key={t} className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-[10px] font-medium uppercase">
                              {t.replace(/_/g, " ")}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-2 px-3 text-gray-500">
                        {new Date(v.createdAt).toLocaleDateString("es-AR")}
                      </td>
                      {isAdmin && (
                        <td className="py-2 px-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setEditingVehiculo(v);
                                setIsEditOpen(true);
                              }}
                            >
                              Editar
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeleteVehiculo(v.id, v.patente)}
                            >
                              Eliminar
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de Edición */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Vehículo</DialogTitle>
          </DialogHeader>
          {editingVehiculo && (
            <form onSubmit={(e) => { e.preventDefault(); handleUpdateVehiculo(new FormData(e.currentTarget)); }} className="space-y-4">
              <div>
                <Label htmlFor="edit-patente">Patente</Label>
                <Input id="edit-patente" name="patente" defaultValue={editingVehiculo.patente} placeholder="ABC 1234" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="edit-marca">Marca</Label>
                  <Input id="edit-marca" name="marca" defaultValue={editingVehiculo.marca} placeholder="Toyota" required />
                </div>
                <div>
                  <Label htmlFor="edit-modelo">Modelo</Label>
                  <Input id="edit-modelo" name="modelo" defaultValue={editingVehiculo.modelo} placeholder="Corolla" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="edit-año">Año</Label>
                  <Input
                    id="edit-año"
                    name="año"
                    type="number"
                    defaultValue={editingVehiculo.año}
                    placeholder="2024"
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    required
                  />
                </div>
                {!isProveedor && (
                  <div>
                    <Label htmlFor="edit-tipo">Tipo</Label>
                    <select
                      id="edit-tipo"
                      name="tipo"
                      defaultValue={editingVehiculo.tipo}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Seleccionar...</option>
                      {TIPOS_VEHICULO_EMPRESA.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              
              {isProveedor && (
                <div className="space-y-2">
                  <Label>Servicios / Tipos</Label>
                  <div className="grid grid-cols-2 gap-2 p-3 border rounded-md">
                    {TIPOS_VEHICULO_PROVEEDOR.map((t) => (
                      <div key={t.value} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`edit-tipo-${t.value}`}
                          name="tipos"
                          value={t.value}
                          defaultChecked={editingVehiculo.tipos?.includes(t.value)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`edit-tipo-${t.value}`} className="text-xs text-gray-700 cursor-pointer">
                          {t.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Actualizando..." : "Guardar Cambios"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
