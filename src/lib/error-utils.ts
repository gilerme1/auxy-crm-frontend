import axios from "axios";

interface ErrorWithResponse {
  response?: {
    status?: number;
    data?: {
      message?: string | string[];
    };
  };
  code?: string;
  message?: string;
}

function isNetworkError(error: ErrorWithResponse): boolean {
  return !error.response && (error.code === "ERR_NETWORK" || error.message === "Network Error");
}

function isAuthError(error: ErrorWithResponse): boolean {
  return error.response?.status === 401;
}

/**
 * Extracts a human-readable error message from an API error or any other error.
 */
export function getErrorMessage(error: any, fallback: string = "Ha ocurrido un error inesperado"): string {
  if (!error) return fallback;
  
  if (axios.isAxiosError(error)) {
    if (isNetworkError(error)) {
      return "Error de conexión. Verifica tu internet.";
    }
    
    if (error.response?.status === 0 || error.response?.status === undefined) {
      return "Error de conexión. Intenta de nuevo.";
    }
    
    if (isAuthError(error)) {
      return "Sesión expirada. Por favor, inicia sesión nuevamente.";
    }
    
    const backendMessage = error.response?.data?.message;
    
    if (backendMessage) {
      if (Array.isArray(backendMessage)) {
        return backendMessage[0];
      }
      return backendMessage;
    }

    if (error.response?.status === 500) {
      return "Error interno del servidor. Por favor, intenta más tarde.";
    }
    
    if (error.response?.status === 404) {
      return "El recurso no fue encontrado.";
    }
  }

  return error?.message || fallback;
}

/**
 * Check if error is a network error (no response from server)
 */
export function isNetworkConnectionError(error: any): boolean {
  if (!error) return false;
  if (axios.isAxiosError(error)) {
    return isNetworkError(error);
  }
  return false;
}
