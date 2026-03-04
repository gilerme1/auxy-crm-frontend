"use client";

import { useState, useEffect } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createUsuario, deleteUsuario, getUsuarios, updateUsuario } from "@/lib/api-data";
import { getVehiculosProveedor, assignOperadorToVehiculo, unassignOperadorFromVehiculo } from "@/lib/api-data";
import { getErrorMessage, isNetworkConnectionError } from "@/lib/error-utils";
import type { Usuario } from "@/types/user";

interface VehiculoProveedor {
  id: string;
  patente: string;
  marca: string;
  modelo: string;
}

export default function ConductoresPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [conductores, setConductores] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingConductor, setEditingConductor] = useState<Usuario | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [vehiculos, setVehiculos] = useState<VehiculoProveedor[]>([]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    if (dataLoaded) return;
    
    loadConductores();
    loadVehiculos();
    setDataLoaded(true);
  }, [authLoading, user, dataLoaded]);

  const loadConductores = async () => {
    try {
      setLoading(true);
      const data = await getUsuarios();
      setConductores(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error("Error cargando conductores:", error);
      if (!isNetworkConnectionError(error)) {
        toast({
          title: "Error",
          description: getErrorMessage(error, "No se pudieron cargar los conductores"),
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const loadVehiculos = async () => {
    try {
      const data = await getVehiculosProveedor();
      setVehiculos(data || []);
    } catch (error: any) {
      console.error("Error cargando vehículos:", error);
    }
  };

  const handleAddConductor = async (formData: FormData) => {
    setIsSubmitting(true);
    try {
      const nombre = formData.get("nombre") as string;
      const apellido = formData.get("apellido") as string;
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;
      const telefono = formData.get("telefono") as string;
      const vehiculoId = formData.get("vehiculoId") as string;

      const nuevoConductor = await createUsuario({
        nombre,
        apellido,
        email,
        password,
        telefono,
        rol: "PROVEEDOR_OPERADOR",
        empresaId: user?.empresaId ?? undefined,
        proveedorId: user?.proveedorId ?? undefined,
      });

      if (vehiculoId && vehiculoId !== "ninguno") {
        await assignOperadorToVehiculo(vehiculoId, nuevoConductor.id);
      }

      toast({
        title: "Éxito",
        description: `Conductor ${email} creado exitosamente`,
      });

      setIsDialogOpen(false);
      await loadConductores();
    } catch (error: any) {
      console.error("Error al crear conductor:", error);
      toast({
        title: "Error",
        description: getErrorMessage(error, "Error al crear conductor"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateConductor = async (formData: FormData) => {
    if (!editingConductor) return;
    setIsSubmitting(true);
    try {
      const nombre = formData.get("nombre") as string;
      const apellido = formData.get("apellido") as string;
      const email = formData.get("email") as string;
      const telefono = formData.get("telefono") as string;
      const vehiculoId = formData.get("vehiculoId") as string;

      await updateUsuario(editingConductor.id, {
        nombre,
        apellido,
        email,
        telefono,
      });

      if (vehiculoId === "ninguno") {
        if (editingConductor.vehiculoProveedorId) {
          await unassignOperadorFromVehiculo(editingConductor.vehiculoProveedorId, editingConductor.id);
        }
      } else if (vehiculoId && vehiculoId !== editingConductor.vehiculoProveedorId) {
        if (editingConductor.vehiculoProveedorId) {
          await unassignOperadorFromVehiculo(editingConductor.vehiculoProveedorId, editingConductor.id);
        }
        await assignOperadorToVehiculo(vehiculoId, editingConductor.id);
      }

      toast({
        title: "Éxito",
        description: "Conductor actualizado correctamente",
      });

      setIsEditOpen(false);
      setEditingConductor(null);
      await loadConductores();
    } catch (error: any) {
      console.error("Error al actualizar conductor:", error);
      toast({
        title: "Error",
        description: getErrorMessage(error, "Error al actualizar conductor"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConductor = async (conductor: Usuario) => {
    if (confirm(`¿Estás seguro de eliminar al conductor ${conductor.email}?`)) {
      try {
        if (conductor.vehiculoProveedorId) {
          await unassignOperadorFromVehiculo(conductor.vehiculoProveedorId, conductor.id);
        }
        await deleteUsuario(conductor.id);
        toast({ title: "Conductor eliminado" });
        await loadConductores();
      } catch (e: any) {
        toast({ 
          title: "Error", 
          description: getErrorMessage(e, "Error al eliminar conductor"), 
          variant: "destructive" 
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Conductores</h1>
        <p className="text-gray-600 mt-1">Gestiona los conductores de tu flota</p>
      </div>

      <div className="flex gap-4">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>+ Agregar Conductor</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invitar Conductor</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); handleAddConductor(new FormData(e.currentTarget)); }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input id="nombre" name="nombre" required />
                </div>
                <div>
                  <Label htmlFor="apellido">Apellido</Label>
                  <Input id="apellido" name="apellido" required />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div>
                <Label htmlFor="telefono">Teléfono</Label>
                <Input id="telefono" name="telefono" type="tel" />
              </div>
              <div>
                <Label htmlFor="password">Contraseña Temporal</Label>
                <Input id="password" name="password" type="password" required />
              </div>
              <div>
                <Label htmlFor="vehiculoId">Vehículo Asignado</Label>
                <Select name="vehiculoId">
                  <SelectTrigger>
                    <SelectValue placeholder="Sin vehículo asignado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ninguno">Sin vehículo</SelectItem>
                    {vehiculos.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.marca} {v.modelo} ({v.patente})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Creando..." : "Crear Conductor"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Gestionar Conductor</DialogTitle>
            </DialogHeader>
            {editingConductor && (
              <form onSubmit={(e) => { e.preventDefault(); handleUpdateConductor(new FormData(e.currentTarget)); }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-nombre">Nombre</Label>
                    <Input id="edit-nombre" name="nombre" defaultValue={editingConductor.nombre} required />
                  </div>
                  <div>
                    <Label htmlFor="edit-apellido">Apellido</Label>
                    <Input id="edit-apellido" name="apellido" defaultValue={editingConductor.apellido} required />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-email">Email</Label>
                  <Input id="edit-email" name="email" type="email" defaultValue={editingConductor.email} required />
                </div>
                <div>
                  <Label htmlFor="edit-telefono">Teléfono</Label>
                  <Input id="edit-telefono" name="telefono" type="tel" defaultValue={editingConductor.telefono || ""} />
                </div>
                <div>
                  <Label htmlFor="edit-vehiculoId">Vehículo Asignado</Label>
                  <Select name="vehiculoId" defaultValue={editingConductor.vehiculoProveedorId || "ninguno"}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sin vehículo asignado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ninguno">Sin vehículo</SelectItem>
                      {vehiculos.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.marca} {v.modelo} ({v.patente})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Conductores</CardTitle>
          <CardDescription>
            {loading ? "Cargando..." : `${conductores.length} conductor(es) encontrado(s)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-gray-600">Cargando conductores...</p>
          ) : conductores.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No hay conductores registrados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Conductor</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Vehículo Asignado</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Estado</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {conductores.map((conductor) => (
                    <tr key={conductor.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <p className="font-semibold">
                          {conductor.nombre} {conductor.apellido}
                        </p>
                        <p className="text-sm text-gray-600">{conductor.email}</p>
                      </td>
                      <td className="py-3 px-4">
                        {conductor.vehiculoProveedor ? (
                          <span className="text-sm">
                            {conductor.vehiculoProveedor.marca} {conductor.vehiculoProveedor.modelo}
                            <span className="text-gray-500 ml-1">
                              ({conductor.vehiculoProveedor.patente})
                            </span>
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">Sin asignar</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-sm ${conductor.isActive ? "text-green-600" : "text-red-600"}`}>
                          {conductor.isActive ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setEditingConductor(conductor);
                              setIsEditOpen(true);
                            }}
                          >
                            Gestionar
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => handleDeleteConductor(conductor)}
                          >
                            Eliminar
                          </Button>
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