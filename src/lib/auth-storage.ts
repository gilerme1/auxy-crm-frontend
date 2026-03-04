import Cookies from "js-cookie";
import type { AuthTokens } from "@/types/auth";

const ACCESS_TOKEN_KEY = "auxy_access_token";
const REFRESH_TOKEN_KEY = "auxy_refresh_token";

function isBrowser() {
  return typeof window !== "undefined";
}

export function getAuthTokens(): AuthTokens | null {
  if (!isBrowser()) return null;
  const accessToken = Cookies.get(ACCESS_TOKEN_KEY);
  const refreshToken = Cookies.get(REFRESH_TOKEN_KEY);
  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
}

export function setAuthTokens(tokens: AuthTokens) {
  if (!isBrowser()) return;
  Cookies.set(ACCESS_TOKEN_KEY, tokens.accessToken, { sameSite: "lax" });
  Cookies.set(REFRESH_TOKEN_KEY, tokens.refreshToken, { sameSite: "lax" });
}

export function clearAuthTokens() {
  if (!isBrowser()) return;
  Cookies.remove(ACCESS_TOKEN_KEY);
  Cookies.remove(REFRESH_TOKEN_KEY);
}

export function getAccessToken(): string | null {
  return getAuthTokens()?.accessToken ?? null;
}

export function getRefreshToken(): string | null {
  return getAuthTokens()?.refreshToken ?? null;
}

