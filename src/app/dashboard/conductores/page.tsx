"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useAuthLoad } from "@/hooks/use-auth-load";
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
import { 
  createUsuario, 
  deleteUsuario, 
  getUsuarios, 
  updateUsuario,
  getVehiculosProveedor, 
  assignOperadorToVehiculo, 
  unassignOperadorFromVehiculo 
} from "@/lib/api-data";
import { notify } from "@/lib/notifier";
import { confirmDelete } from "@/lib/confirm";
import { getErrorMessage } from "@/lib/error-utils";
import type { Usuario } from "@/types/user";

// Interfaz actualizada para incluir los operadores que vienen del backend
interface VehiculoProveedor {
  id: string;
  patente: string;
  marca: string;
  modelo: string;
  operadores?: { id: string }[]; 
}

export default function ConductoresPage() {
  const { user } = useAuth();
  const { isReady } = useAuthLoad();
  
  const [conductores, setConductores] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingConductor, setEditingConductor] = useState<Usuario | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [vehiculos, setVehiculos] = useState<VehiculoProveedor[]>([]);
  const [vehiculosLoading, setVehiculosLoading] = useState(false);

  // --- LÓGICA DE FILTRADO CORREGIDA ---
  
  // Para crear: Solo vehículos que NO tienen operadores
  const vehiculosLibres = useMemo(() => 
    vehiculos.filter((v) => !v.operadores || v.operadores.length === 0),
    [vehiculos]
  );

  // Para editar: Vehículos libres O el vehículo que ya tiene el conductor actual
  const vehiculosParaEdicion = useMemo(() => 
    vehiculos.filter((v) => {
      const sinOperadores = !v.operadores || v.operadores.length === 0;
      const esElActual = v.id === editingConductor?.vehiculoProveedorId;
      return sinOperadores || esElActual;
    }),
    [vehiculos, editingConductor]
  );

  useEffect(() => {
    if (!isReady || dataLoaded) return;
    loadData();
    setDataLoaded(true);
  }, [isReady, dataLoaded]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadConductores(), loadVehiculos()]);
    setLoading(false);
  };

  const loadConductores = async () => {
    try {
      const data = await getUsuarios();
      setConductores(Array.isArray(data) ? data : []);
    } catch (error) {
      notify({ title: "Error", description: getErrorMessage(error, "Error al cargar conductores"), variant: "destructive" });
    }
  };

  const loadVehiculos = async () => {
    try {
      setVehiculosLoading(true);
      const data = await getVehiculosProveedor();
      setVehiculos(data || []);
    } catch (error) {
      notify({ title: "Error", description: getErrorMessage(error, "Error al cargar vehículos"), variant: "destructive" });
    } finally {
      setVehiculosLoading(false);
    }
  };

  const handleAddConductor = async (formData: FormData) => {
    setIsSubmitting(true);
    try {
      const vehiculoId = formData.get("vehiculoId") as string;

      const nuevoConductor = await createUsuario({
        nombre: formData.get("nombre") as string,
        apellido: formData.get("apellido") as string,
        email: formData.get("email") as string,
        password: formData.get("password") as string,
        telefono: formData.get("telefono") as string,
        rol: "PROVEEDOR_OPERADOR",
        empresaId: user?.empresaId ?? undefined,
        proveedorId: user?.proveedorId ?? undefined,
      });

      if (vehiculoId && vehiculoId !== "ninguno") {
        await assignOperadorToVehiculo(vehiculoId, nuevoConductor.id);
      }

      notify({ title: "Éxito", description: "Conductor creado", variant: "success" });
      setIsDialogOpen(false);
      await loadData(); // Recargamos todo para actualizar estados de ocupación
    } catch (error) {
      notify({ title: "Error", description: getErrorMessage(error), variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateConductor = async (formData: FormData) => {
    if (!editingConductor) return;
    setIsSubmitting(true);
    try {
      const vehiculoId = formData.get("vehiculoId") as string;

      await updateUsuario(editingConductor.id, {
        nombre: formData.get("nombre") as string,
        apellido: formData.get("apellido") as string,
        email: formData.get("email") as string,
        telefono: formData.get("telefono") as string,
      });

      if (vehiculoId === "ninguno") {
        if (editingConductor.vehiculoProveedorId) {
          await unassignOperadorFromVehiculo(editingConductor.vehiculoProveedorId, editingConductor.id);
        }
      } else if (vehiculoId !== editingConductor.vehiculoProveedorId) {
        if (editingConductor.vehiculoProveedorId) {
          await unassignOperadorFromVehiculo(editingConductor.vehiculoProveedorId, editingConductor.id);
        }
        await assignOperadorToVehiculo(vehiculoId, editingConductor.id);
      }

      notify({ title: "Éxito", description: "Conductor actualizado", variant: "success" });
      setIsEditOpen(false);
      await loadData();
    } catch (error) {
      notify({ title: "Error", description: getErrorMessage(error), variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConductor = async (conductor: Usuario) => {
    const confirmed = await confirmDelete(`¿Eliminar a ${conductor.email}?`);
    if (!confirmed) return;
    try {
      if (conductor.vehiculoProveedorId) {
        await unassignOperadorFromVehiculo(conductor.vehiculoProveedorId, conductor.id);
      }
      await deleteUsuario(conductor.id);
      notify({ title: "Eliminado", variant: "success" });
      await loadData();
    } catch (e) {
      notify({ title: "Error", description: getErrorMessage(e), variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Conductores</h1>
        <p className="text-gray-600 mt-1">Gestiona los conductores de tu flota</p>
      </div>

      <div className="flex gap-4">
        {/* MODAL CREAR */}
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
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input id="nombre" name="nombre" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apellido">Apellido</Label>
                  <Input id="apellido" name="apellido" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña Temporal</Label>
                <Input id="password" name="password" type="password" required />
              </div>
              <div className="space-y-2">
                <Label>Vehículo Asignado (Solo Libres)</Label>
                <Select name="vehiculoId" defaultValue="ninguno">
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar vehículo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ninguno">Sin vehículo</SelectItem>
                    {vehiculosLibres.map((v) => (
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

        {/* MODAL EDITAR */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Gestionar Conductor</DialogTitle>
            </DialogHeader>
            {editingConductor && (
              <form onSubmit={(e) => { e.preventDefault(); handleUpdateConductor(new FormData(e.currentTarget)); }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-nombre">Nombre</Label>
                    <Input id="edit-nombre" name="nombre" defaultValue={editingConductor.nombre} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-apellido">Apellido</Label>
                    <Input id="edit-apellido" name="apellido" defaultValue={editingConductor.apellido} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Vehículo Asignado</Label>
                  <Select name="vehiculoId" defaultValue={editingConductor.vehiculoProveedorId || "ninguno"}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ninguno">Sin vehículo</SelectItem>
                      {vehiculosParaEdicion.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.marca} {v.modelo} ({v.patente})
                          {v.id === editingConductor?.vehiculoProveedorId ? " (actual)" : ""}
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b font-medium text-gray-500">
                  <th className="text-left py-3 px-4">Conductor</th>
                  <th className="text-left py-3 px-4">Vehículo</th>
                  <th className="text-right py-3 px-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {conductores.map((conductor) => (
                  <tr key={conductor.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <p className="font-semibold">{conductor.nombre} {conductor.apellido}</p>
                      <p className="text-xs text-gray-400">{conductor.email}</p>
                    </td>
                    <td className="py-3 px-4">
                      {conductor.vehiculoProveedor ? (
                        <span>{conductor.vehiculoProveedor.marca} ({conductor.vehiculoProveedor.patente})</span>
                      ) : (
                        <span className="text-gray-400 italic">Libre</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button variant="ghost" size="sm" onClick={() => { setEditingConductor(conductor); setIsEditOpen(true); }}>
                        Editar
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDeleteConductor(conductor)}>
                        Eliminar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}