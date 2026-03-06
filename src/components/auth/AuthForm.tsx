"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { notify } from "@/lib/notifier";
import { Eye, EyeOff } from "lucide-react";
import { login, registerEmpresa, registerProveedor, getGoogleOAuthUrl } from "@/lib/api-auth";
import { setAuthTokens } from "@/lib/auth-storage";
import { useAuth } from "@/contexts/auth-context";
import { getErrorMessage } from "@/lib/error-utils";
import type { RolUsuario } from "@/types/auth";

export function AuthForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState("CLIENTE_OPERADOR");
  // Notificaciones centralizadas con Sonner
  const router = useRouter();
  // Password visibility toggles
  const [showLoginPwd, setShowLoginPwd] = useState(false);
  const [showRegisterPwd, setShowRegisterPwd] = useState(false);
  const { refetchUser } = useAuth();

  const handleLogin = async (formData: FormData) => {
    setIsLoading(true);
    try {
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;

      const res = await login({ email, password });
      setAuthTokens({
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
      });

      await refetchUser();
      notify({ title: "Inicio de sesión exitoso", variant: "success" });
      router.replace("/");
    } catch (error: any) {
      console.error(error);
      notify({
        title: "Error al iniciar sesión",
        description: getErrorMessage(error, "Verifica tus credenciales"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (formData: FormData) => {
    setIsLoading(true);
    try {
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;
      const nombre = formData.get("nombre") as string;
      const apellido = formData.get("apellido") as string;
      const telefono = formData.get("phone") as string;
      const rolForm = formData.get("role") as string;
      const razonSocial = formData.get("razonSocial") as string;
      const cuit = formData.get("cuit") as string;
      const direccion = formData.get("direccion") as string;
      const contactoEmail = formData.get("contactoEmail") as string;
      const contactoTelefono = formData.get("contactoTelefono") as string;
      const serviciosOfrecidos = formData.getAll("serviciosOfrecidos") as string[];

      // Convert empty strings to undefined for optional fields to satisfy backend validation
      const safeTelefono = telefono.trim() || undefined;
      const safeDireccion = direccion.trim() || undefined;
      const safeContactoTelefono = contactoTelefono.trim() || undefined;

      if (rolForm === "PROVEEDOR_OPERADOR" && serviciosOfrecidos.length === 0) {
        notify({ title: "Faltan servicios", description: "Debes seleccionar al menos un servicio ofrecido.", variant: "destructive" });
        setIsLoading(false);
        return;
      }

      let res;
      if (rolForm === "CLIENTE_OPERADOR") {
        res = await registerEmpresa({
          email,
          password,
          nombre,
          apellido,
          telefono: safeTelefono,
          razonSocial,
          cuit,
          direccion, // Required for Empresa
          contactoEmail,
          contactoTelefono: safeContactoTelefono,
        });
      } else if (rolForm === "PROVEEDOR_OPERADOR") {
        res = await registerProveedor({
          email,
          password,
          nombre,
          apellido,
          telefono: safeTelefono,
          razonSocial,
          cuit,
          contactoEmail,
          contactoTelefono, // Required for Proveedor (must not be undefined if empty, let backend throw)
          direccion: safeDireccion,
          serviciosOfrecidos,
        });
      }

      if (res) {
        setAuthTokens({
          accessToken: res.accessToken,
          refreshToken: res.refreshToken,
        });
        await refetchUser();
        notify({ title: "Registro exitoso", description: "Iniciando sesión...", variant: "success" });
        router.replace("/");
      }

      // Navigation is now handled if 'res' is present, removing old manual login logic
      
    } catch (error: any) {
      console.error("Registration error:", error);
      notify({
        title: "Error al registrarse",
        description: getErrorMessage(error, "No se pudo completar el registro. Intenta nuevamente."),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const url = getGoogleOAuthUrl();
    window.location.href = url;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 bg-auxy-red rounded-sm flex items-center justify-center">
              <div
                className="w-4 h-4 bg-white"
                style={{
                  clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
                }}
              />
            </div>
            <span className="text-2xl font-bold text-auxy-navy">Auxy</span>
          </div>
          <CardTitle className="text-auxy-navy">CRM Platform</CardTitle>
          <CardDescription>
            Plataforma de gestión de auxilio vehicular
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
              <TabsTrigger value="register">Registrarse</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={(e) => { e.preventDefault(); handleLogin(new FormData(e.currentTarget)); }} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" required />
                </div>
              <div className="space-y-1">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input id="password" name="password" type={showLoginPwd ? 'text' : 'password'} required className="pr-10" />
                  <button
                    type="button"
                    aria-label="Mostrar/ocultar contraseña"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowLoginPwd(v => !v)}
                  >
                    {showLoginPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
                <Button
                  type="submit"
                  className="w-full bg-auxy-red hover:bg-red-700 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? "Iniciando..." : "Iniciar Sesión"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full mt-2"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                >
                  Continuar con Google
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={(e) => { e.preventDefault(); handleRegister(new FormData(e.currentTarget)); }} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="nombre">Nombre</Label>
                    <Input id="nombre" name="nombre" placeholder="Ej: Juan" required />
                  </div>
                  <div>
                    <Label htmlFor="apellido">Apellido</Label>
                    <Input id="apellido" name="apellido" placeholder="Ej: Pérez" required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="email">Email de Acceso</Label>
                    <Input id="email" name="email" type="email" placeholder="admin@ejemplo.com" required />
                  </div>
                  <div>
                    <Label htmlFor="phone">Teléfono Móvil {selectedRole === "CLIENTE_OPERADOR" && "(Opcional)"}</Label>
                    <Input id="phone" name="phone" type="tel" placeholder="+598..." required={selectedRole === "PROVEEDOR_OPERADOR"} />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <Label htmlFor="role">Tipo de Registro</Label>
                    <Select name="role" defaultValue={selectedRole} onValueChange={setSelectedRole}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CLIENTE_OPERADOR">Empresa (Cliente)</SelectItem>
                        <SelectItem value="PROVEEDOR_OPERADOR">Prestador (Grúa/Auxilio)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Datos de la Entidad</p>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="razonSocial">Razón Social</Label>
                      <Input id="razonSocial" name="razonSocial" placeholder="Ej: Servicios de Auxilio S.A." required />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="cuit">RUT / CUIT</Label>
                        <Input 
                          id="cuit" 
                          name="cuit" 
                          placeholder={selectedRole === "PROVEEDOR_OPERADOR" ? "Exactamente 11 dígitos" : "11 o 12 dígitos"}
                          minLength={11}
                          maxLength={selectedRole === "PROVEEDOR_OPERADOR" ? 11 : 12}
                          required 
                        />
                      </div>
                      <div>
                        <Label htmlFor="direccion">Dirección Fiscal {selectedRole === "PROVEEDOR_OPERADOR" && "(Opcional)"}</Label>
                        <Input 
                          id="direccion" 
                          name="direccion" 
                          placeholder="Calle 123, Ciudad" 
                          required={selectedRole === "CLIENTE_OPERADOR"} 
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="contactoEmail">Email de Contacto</Label>
                        <Input id="contactoEmail" name="contactoEmail" type="email" placeholder="contacto@empresa.com" required />
                      </div>
                      <div>
                        <Label htmlFor="contactoTelefono">Tel. de Contacto {selectedRole === "CLIENTE_OPERADOR" && "(Opcional)"}</Label>
                        <Input id="contactoTelefono" name="contactoTelefono" type="tel" placeholder="+598..." required={selectedRole === "PROVEEDOR_OPERADOR"} />
                      </div>
                    </div>
                    {selectedRole === "PROVEEDOR_OPERADOR" && (
                      <div className="pt-2">
                        <Label>Servicios Ofrecidos (Mínimo 1)</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <label className="flex items-center space-x-2 text-sm text-gray-700">
                            <input type="checkbox" name="serviciosOfrecidos" value="GRUA" className="rounded border-gray-300 text-auxy-red focus:ring-auxy-red" />
                            <span>Grúa / Remolque</span>
                          </label>
                          <label className="flex items-center space-x-2 text-sm text-gray-700">
                            <input type="checkbox" name="serviciosOfrecidos" value="MECANICA_LIGERA" className="rounded border-gray-300 text-auxy-red focus:ring-auxy-red" />
                            <span>Mecánica Ligera</span>
                          </label>
                          <label className="flex items-center space-x-2 text-sm text-gray-700">
                            <input type="checkbox" name="serviciosOfrecidos" value="CERRAJERIA" className="rounded border-gray-300 text-auxy-red focus:ring-auxy-red" />
                            <span>Cerrajería</span>
                          </label>
                          <label className="flex items-center space-x-2 text-sm text-gray-700">
                            <input type="checkbox" name="serviciosOfrecidos" value="GOMERIA" className="rounded border-gray-300 text-auxy-red focus:ring-auxy-red" />
                            <span>Gomería / Neumáticos</span>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="password">Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showRegisterPwd ? 'text' : 'password'}
                      placeholder={`Mínimo ${selectedRole === "PROVEEDOR_OPERADOR" ? "8" : "6"} caracteres`}
                      minLength={selectedRole === "PROVEEDOR_OPERADOR" ? 8 : 6}
                      required
                      className="pr-10"
                    />
                    <button type="button" aria-label="Mostrar/ocultar contraseña" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowRegisterPwd(v => !v)}>
                      {showRegisterPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-auxy-red hover:bg-red-700 text-white mt-2"
                  disabled={isLoading}
                >
                  {isLoading ? "Creando cuenta..." : "Completar Registro"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

