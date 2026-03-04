"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { getAuthTokens, clearAuthTokens } from "@/lib/auth-storage";
import { getCurrentUser, logout as logoutApi } from "@/lib/api-auth";
import type { AuthUser, AuthTokens } from "@/types/auth";

interface AuthContextType {
  user: AuthUser | null;
  tokens: AuthTokens | null;
  loading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refetchUser = useCallback(async () => {
    try {
      const currentTokens = getAuthTokens();
      if (!currentTokens?.accessToken) {
        setUser(null);
        setTokens(null);
        return;
      }

      const userData = await getCurrentUser();

      if (userData?.id) {
        setUser({
          id: userData.id,
          email: userData.email,
          nombre: userData.nombre,
          apellido: userData.apellido,
          rol: userData.rol,
          empresaId: userData.empresaId,
          proveedorId: userData.proveedorId,
          isActive: userData.isActive,
          fotoPerfil: userData.fotoPerfil,
        });
        setTokens(currentTokens);
      } else {
        setUser(null);
        setTokens(null);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      // Bug fix: 401 errors must clear the session immediately
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        clearAuthTokens();
        setUser(null);
        setTokens(null);
      }
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      clearAuthTokens();
      setUser(null);
      setTokens(null);
      router.push("/");
    }
  }, [router]);

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      try {
        const currentTokens = getAuthTokens();
        if (currentTokens?.accessToken) {
          const userData = await getCurrentUser();
          setUser(userData);
          setTokens(currentTokens);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        clearAuthTokens();
        setUser(null);
        setTokens(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const value: AuthContextType = {
    user,
    tokens,
    loading,
    isAuthenticated: !!user && !!tokens,
    logout,
    refetchUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
