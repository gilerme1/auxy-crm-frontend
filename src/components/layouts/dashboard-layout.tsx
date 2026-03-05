"use client";

import React, { useState, useRef, useEffect } from "react";
import ErrorBoundary from "../ErrorBoundary";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Car, 
  BarChart3, 
  ChevronDown, 
  LogOut, 
  UserCircle,
  Settings
} from "lucide-react";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer click afuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  const getDashboardLinks = () => {
    if (!user) return [];
    const links = [];

    if (user.rol === "SUPER_ADMIN") {
      links.push(
        { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
        { href: "/dashboard/solicitudes", label: "Solicitudes", icon: FileText },
        { href: "/dashboard/usuarios", label: "Usuarios", icon: Users },
        { href: "/dashboard/reportes", label: "Reportes", icon: BarChart3 },
      );
    } else if (user.rol === "CLIENTE_ADMIN") {
      links.push(
        { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
        { href: "/dashboard/solicitudes", label: "Solicitudes", icon: FileText },
        { href: "/dashboard/vehiculos", label: "Vehículos", icon: Car },
        { href: "/dashboard/usuarios", label: "Usuarios", icon: Users },
        { href: "/dashboard/reportes", label: "Reportes", icon: BarChart3 },
      );
    } else if (user.rol === "CLIENTE_OPERADOR") {
      links.push(
        { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
        { href: "/dashboard/solicitudes", label: "Solicitudes", icon: FileText },
        { href: "/dashboard/vehiculos", label: "Vehículos", icon: Car },
      );
    } else if (user.rol === "PROVEEDOR_ADMIN") {
      links.push(
        { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
        { href: "/dashboard/solicitudes", label: "Solicitudes", icon: FileText },
        { href: "/dashboard/vehiculos", label: "Vehículos", icon: Car },
        { href: "/dashboard/usuarios", label: "Conductores", icon: Users },
        { href: "/dashboard/reportes", label: "Reportes", icon: BarChart3 },
      );
    } else if (user.rol === "PROVEEDOR_OPERADOR") {
      links.push(
        { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
        { href: "/dashboard/solicitudes", label: "Solicitudes", icon: FileText },
        { href: "/dashboard/vehiculos", label: "Vehículos", icon: Car },
      );
    }

    return links;
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl flex flex-col border-r border-slate-100 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:w-72 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}>
        {/* Logo */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center justify-center gap-3">
            <img 
              src="/auxy-logo.png" 
              alt="Auxy" 
              className="h-10 w-auto object-contain"
            />
            <div className="text-left">
              <h1 className="text-xl font-black text-auxy-navy leading-none tracking-tight">Auxy</h1>
              <p className="text-[10px] text-gray-400 font-semibold tracking-wide flex items-center gap-1 mt-0.5">
                CRM <span className="w-1 h-1 rounded-full bg-auxy-yellow block"></span> Platform
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          <div className="flex flex-col px-3 pt-2 pb-3">
            <p className="text-[11px] font-black uppercase tracking-wider text-gray-400">Dashboard</p>
            <p className="text-[10px] font-bold text-auxy-navy uppercase tracking-widest opacity-80 mt-0.5">
              {user?.rol.replace(/_/g, ' ')}
            </p>
          </div>
          {getDashboardLinks().map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-semibold
                ${isActive(link.href)
                  ? "bg-auxy-navy text-white shadow-md relative before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-2/3 before:bg-auxy-yellow before:rounded-r-md"
                  : "text-gray-600 hover:bg-slate-50 hover:text-auxy-navy"
                }`}
            >
              <link.icon className={`h-4 w-4 shrink-0 transition-colors ${isActive(link.href) ? "text-auxy-yellow" : "text-gray-400"}`} />
              {link.label}
            </Link>
          ))}
        </nav>

      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden w-full relative">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 md:px-8 py-4 flex justify-between items-center shadow-sm sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-2 rounded-lg bg-slate-50 text-auxy-navy hover:bg-slate-100 lg:hidden focus:outline-none transition-colors"
            >
              <LayoutDashboard className="h-5 w-5" />
            </button>
            <p className="text-slate-600 text-sm md:text-base hidden sm:block">
              Bienvenid@, <span className="font-bold text-slate-900">{user?.nombre}</span>
            </p>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-400">
              {new Date().toLocaleDateString("es-AR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </span>

            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setProfileOpen((o) => !o)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all"
              >
                <div className="h-7 w-7 rounded-full bg-auxy-navy flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                  {user?.fotoPerfil ? (
                    <img src={user.fotoPerfil} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <span>{user?.nombre?.charAt(0)}</span>
                  )}
                </div>
                <span className="text-sm font-medium text-gray-700 max-w-[100px] truncate">{user?.nombre}</span>
                <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform ${profileOpen ? "rotate-180" : ""}`} />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-100 rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-50 bg-slate-50">
                    <p className="text-xs font-bold text-gray-900 truncate">{user?.nombre} {user?.apellido}</p>
                    <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
                  </div>
                  <div className="p-1.5">
                    <Link
                      href="/dashboard/configuracion"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-slate-50 transition-colors"
                      onClick={() => setProfileOpen(false)}
                    >
                      <UserCircle className="h-4 w-4 text-gray-400" />
                      Mi Perfil
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors mt-0.5"
                    >
                      <LogOut className="h-4 w-4" />
                      Cerrar Sesión
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      {/* Content with error boundary */}
      <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-4 md:p-8 w-full">
        <ErrorBoundary>{children}</ErrorBoundary>
      </div>
      </div>
    </div>
  );
}
