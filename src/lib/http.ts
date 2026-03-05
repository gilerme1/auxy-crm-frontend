import axios from "axios";
import {
  getAccessToken,
  getRefreshToken,
  setAuthTokens,
  clearAuthTokens,
} from "./auth-storage";
import type { AuthTokens } from "@/types/auth";

// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (process.env.NODE_ENV === 'development') {
  console.log("🚀 Conectado a API:", API_BASE_URL);
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let refreshPromise: Promise<AuthTokens | null> | null = null;

async function refreshTokens(): Promise<AuthTokens | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const response = await api.post<AuthTokens>("/auth/refresh", {
      refreshToken,
    });
    const tokens = response.data;
    setAuthTokens(tokens);
    return tokens;
  } catch {
    clearAuthTokens();
    return null;
  }
}

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      console.warn("No authentication tokens available");
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!error.response) {
      if (error.code === "ERR_NETWORK" || error.message === "Network Error") {
        console.warn("Network error - API might be unavailable");
      }
      return Promise.reject(error);
    }

    if (
      originalRequest &&
      !originalRequest._retry &&
      error.response?.status === 401
    ) {
      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = refreshTokens().finally(() => {
          isRefreshing = false;
          refreshPromise = null;
        });
      }

      try {
        const newTokens = await refreshPromise;

        if (newTokens) {
          originalRequest.headers = originalRequest.headers ?? {};
          originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        clearAuthTokens();
      }
    }

    return Promise.reject(error);
  },
);
