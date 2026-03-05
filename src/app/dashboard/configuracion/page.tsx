"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { notify } from "@/lib/notifier";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { uploadFotoPerfil } from "@/lib/api-data";
import { Camera, User, Mail, Shield, Upload } from "lucide-react";

export default function ConfiguracionPage() {
  const { user, refetchUser } = useAuth();
  const [uploading, setUploading] = useState(false);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || !user) return;
    const file = e.target.files[0];

    setUploading(true);
    try {
      await uploadFotoPerfil(user.id, file);
      notify({ title: "Foto de perfil actualizada" });
      await refetchUser();
    } catch (error) {
      notify({
        title: "Error",
        description: "No se pudo actualizar la foto de perfil",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Mi Perfil</h1>
        <p className="text-gray-600 mt-1">Gestiona tu información personal y preferencias</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card de Foto de Perfil */}
        <Card className="md:col-span-1 border-t-4 border-t-auxy-navy overflow-hidden">
          <CardHeader className="bg-slate-50/50 text-center">
            <CardTitle className="text-sm font-bold uppercase text-gray-500">Foto de Perfil</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative group">
                <div className="h-32 w-32 rounded-full bg-auxy-navy flex items-center justify-center text-white text-4xl font-bold overflow-hidden border-4 border-white shadow-xl ring-2 ring-slate-100">
                  {user?.fotoPerfil ? (
                    <img src={user.fotoPerfil} alt="Perfil" className="h-full w-full object-cover" />
                  ) : (
                    <span>{user?.nombre?.charAt(0)}</span>
                  )}
                </div>
                <label className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg border cursor-pointer hover:bg-slate-50 transition-colors group-hover:scale-110">
                  <Camera className="h-5 w-5 text-auxy-navy" />
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={uploading}
                  />
                </label>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-gray-900">{user?.nombre} {user?.apellido}</p>
                <p className="text-xs text-gray-500">{user?.rol.replace('_', ' ')}</p>
              </div>
              {uploading && (
                <div className="flex items-center gap-2 text-xs text-auxy-navy animate-pulse">
                  <Upload className="h-3 w-3" /> Subiendo...
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card de Datos del Usuario */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-auxy-navy" /> Datos Personales
            </CardTitle>
            <CardDescription>Información básica de tu cuenta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nombre Completo</p>
                <div className="flex items-center gap-2 text-gray-700">
                  <User className="h-4 w-4 opacity-40" />
                  <p className="font-medium">{user?.nombre} {user?.apellido}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Correo Electrónico</p>
                <div className="flex items-center gap-2 text-gray-700">
                  <Mail className="h-4 w-4 opacity-40" />
                  <p className="font-medium underline decoration-slate-200 underline-offset-4">{user?.email}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Rol del Sistema</p>
                <div className="flex items-center gap-2 text-gray-700">
                  <Shield className="h-4 w-4 opacity-40 text-auxy-navy" />
                  <p className="font-bold text-auxy-navy">{user?.rol.replace('_', ' ')}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Estado de Cuenta</p>
                <div className="flex items-center gap-2">
                   <div className="h-2 w-2 rounded-full bg-green-500" />
                   <p className="text-sm font-medium text-green-700">Activo</p>
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <p className="text-xs text-gray-500 italic">
                * Tu información está sincronizada con los servidores centrales de Auxy. 
                Si necesitas cambiar datos protegidos, contacta con asistencia.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
