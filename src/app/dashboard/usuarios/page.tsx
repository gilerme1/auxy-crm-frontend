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
import { createUsuario, deleteUsuario, getUsuarios, toggleUsuarioActive, updateUsuario, getVehiculosProveedor, assignOperadorToVehiculo, unassignOperadorFromVehiculo } from "@/lib/api-data";
import { getErrorMessage, isNetworkConnectionError } from "@/lib/error-utils";

interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: string;
  isActive: boolean;
  telefono?: string;
  vehiculoProveedorId?: string;
  vehiculoProveedor?: {
    id: string;
    patente: string;
    marca: string;
    modelo: string;
  };
}

interface VehiculoProveedor {
  id: string;
  patente: string;
  marca: string;
  modelo: string;
}

export default function UsuariosPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [vehiculos, setVehiculos] = useState<VehiculoProveedor[]>([]);

  const isProveedor = user?.rol === "PROVEEDOR_ADMIN" || user?.rol === "PROVEEDOR_OPERADOR";
  const isAdmin = user?.rol === "CLIENTE_ADMIN" || user?.rol === "PROVEEDOR_ADMIN";
  const pageTitle = isProveedor ? "Conductores" : "Usuarios";

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    if (dataLoaded) return;
    
    loadUsuarios();
    if (isProveedor) {
      loadVehiculos();
    }
    setDataLoaded(true);
  }, [authLoading, user, dataLoaded, isProveedor]);

  const loadUsuarios = async () => {
    try {
      setLoading(true);
      const data = await getUsuarios();
      setUsuarios(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error("Error cargando usuarios:", error);
      if (!isNetworkConnectionError(error)) {
        toast({
          title: "Error",
          description: getErrorMessage(error, "No se pudieron cargar los usuarios"),
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

  const handleAddUsuario = async (formData: FormData) => {
    setIsSubmitting(true);
    try {
      const nombre = formData.get("nombre") as string;
      const apellido = formData.get("apellido") as string;
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;
      const telefono = formData.get("telefono") as string;
      const vehiculoId = formData.get("vehiculoId") as string;

      const rol =
        user?.rol === "CLIENTE_ADMIN"
          ? "CLIENTE_OPERADOR"
          : "PROVEEDOR_OPERADOR";

      const nuevoUsuario = await createUsuario({
        nombre,
        apellido,
        email,
        password,
        telefono,
        rol,
        empresaId: user?.empresaId ?? undefined,
        proveedorId: user?.proveedorId ?? undefined,
      });

      if (isProveedor && vehiculoId && vehiculoId !== "ninguno") {
        await assignOperadorToVehiculo(vehiculoId, nuevoUsuario.id);
      }

      toast({
        title: "Éxito",
        description: `${isProveedor ? "Conductor" : "Usuario"} ${email} creado exitosamente`,
      });

      setIsDialogOpen(false);
      await loadUsuarios();
    } catch (error: any) {
      console.error("Error al crear usuario:", error);
      toast({
        title: "Error",
        description: getErrorMessage(error, `Error al crear ${isProveedor ? "conductor" : "usuario"}`),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateUsuario = async (formData: FormData) => {
    if (!editingUsuario) return;
    setIsSubmitting(true);
    try {
      const nombre = formData.get("nombre") as string;
      const apellido = formData.get("apellido") as string;
      const email = formData.get("email") as string;
      const telefono = formData.get("telefono") as string;
      const vehiculoId = formData.get("vehiculoId") as string;

      await updateUsuario(editingUsuario.id, {
        nombre,
        apellido,
        email,
        telefono,
      });

      if (isProveedor) {
        if (vehiculoId === "ninguno") {
          if (editingUsuario.vehiculoProveedorId) {
            await unassignOperadorFromVehiculo(editingUsuario.vehiculoProveedorId, editingUsuario.id);
          }
        } else if (vehiculoId && vehiculoId !== editingUsuario.vehiculoProveedorId) {
          if (editingUsuario.vehiculoProveedorId) {
            await unassignOperadorFromVehiculo(editingUsuario.vehiculoProveedorId, editingUsuario.id);
          }
          await assignOperadorToVehiculo(vehiculoId, editingUsuario.id);
        }
      }

      toast({
        title: "Éxito",
        description: `${isProveedor ? "Conductor" : "Usuario"} actualizado correctamente`,
      });

      setIsEditOpen(false);
      setEditingUsuario(null);
      await loadUsuarios();
    } catch (error: any) {
      console.error("Error al actualizar usuario:", error);
      toast({
        title: "Error",
        description: getErrorMessage(error, `Error al actualizar ${isProveedor ? "conductor" : "usuario"}`),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUsuario = async (usr: Usuario) => {
    const word = isProveedor ? "conductor" : "usuario";
    if (confirm(`¿Estás seguro de eliminar al ${word} ${usr.email}?`)) {
      try {
        if (isProveedor && usr.vehiculoProveedorId) {
          await unassignOperadorFromVehiculo(usr.vehiculoProveedorId, usr.id);
        }
        await deleteUsuario(usr.id);
        toast({ title: `${isProveedor ? "Conductor" : "Usuario"} eliminado` });
        await loadUsuarios();
      } catch (e: any) {
        toast({ 
          title: "Error", 
          description: getErrorMessage(e, `Error al eliminar ${word}`), 
          variant: "destructive" 
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{pageTitle}</h1>
        <p className="text-gray-600 mt-1">
          {isAdmin
            ? `Gestiona los ${pageTitle.toLowerCase()} de tu cuenta`
            : `Visualiza los ${pageTitle.toLowerCase()} con acceso a tu cuenta`}
        </p>
      </div>

      {isAdmin && (
        <div className="flex gap-4">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>+ Agregar {isProveedor ? "Conductor" : "Usuario"}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {user?.rol === "CLIENTE_ADMIN"
                    ? "Invitar Operador"
                    : "Invitar Operador / Conductor"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); handleAddUsuario(new FormData(e.currentTarget)); }} className="space-y-4">
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
                {isProveedor && (
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
                )}
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Creando..." : `Crear ${isProveedor ? "Conductor" : "Usuario"}`}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Gestionar {isProveedor ? "Conductor" : "Usuario"}</DialogTitle>
              </DialogHeader>
              {editingUsuario && (
                <form onSubmit={(e) => { e.preventDefault(); handleUpdateUsuario(new FormData(e.currentTarget)); }} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-nombre">Nombre</Label>
                      <Input id="edit-nombre" name="nombre" defaultValue={editingUsuario.nombre} required />
                    </div>
                    <div>
                      <Label htmlFor="edit-apellido">Apellido</Label>
                      <Input id="edit-apellido" name="apellido" defaultValue={editingUsuario.apellido} required />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="edit-email">Email</Label>
                    <Input id="edit-email" name="email" type="email" defaultValue={editingUsuario.email} required />
                  </div>
                  <div>
                    <Label htmlFor="edit-telefono">Teléfono</Label>
                    <Input id="edit-telefono" name="telefono" type="tel" defaultValue={editingUsuario.telefono || ""} />
                  </div>
                  {isProveedor && (
                    <div>
                      <Label htmlFor="edit-vehiculoId">Vehículo Asignado</Label>
                      <Select name="vehiculoId" defaultValue={editingUsuario.vehiculoProveedorId || "ninguno"}>
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
                  )}
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Guardando..." : "Guardar Cambios"}
                  </Button>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Listado de {pageTitle}</CardTitle>
          <CardDescription>
            {loading ? "Cargando..." : `${usuarios.length} ${pageTitle.toLowerCase()} encontrado(s)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-gray-600">Cargando {pageTitle.toLowerCase()}...</p>
          ) : usuarios.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No hay {pageTitle.toLowerCase()} registrados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">{isProveedor ? "Conductor" : "Usuario"}</th>
                    {isProveedor && (
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Vehículo Asignado</th>
                    )}
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Rol</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Estado</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((usr) => (
                    <tr key={usr.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <p className="font-semibold">
                          {usr.nombre} {usr.apellido}
                        </p>
                        <p className="text-sm text-gray-600">{usr.email}</p>
                      </td>
                      {isProveedor && (
                        <td className="py-3 px-4">
                          {usr.vehiculoProveedor ? (
                            <span className="text-sm">
                              {usr.vehiculoProveedor.marca} {usr.vehiculoProveedor.modelo}
                              <span className="text-gray-500 ml-1">
                                ({usr.vehiculoProveedor.patente})
                              </span>
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">Sin asignar</span>
                          )}
                        </td>
                      )}
                      <td className="py-3 px-4">
                        <span className="text-sm font-medium text-auxy-navy">
                          {usr.rol}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-sm ${usr.isActive ? "text-green-600" : "text-red-600"}`}>
                          {usr.isActive ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isAdmin && (
                          <div className="flex gap-2 justify-end">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setEditingUsuario(usr);
                                setIsEditOpen(true);
                              }}
                            >
                              Gestionar
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => handleDeleteUsuario(usr)}
                            >
                              Eliminar
                            </Button>
                          </div>
                        )}
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