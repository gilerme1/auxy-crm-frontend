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

// Translators for common backend validation messages (Spanish)
function translateValidationMessage(msg: string): string {
  const map: Record<string, string> = {
    "must be an email": "El email no tiene un formato válido",
    "must be longer than or equal to 6 characters": "La contraseña debe tener al menos 6 caracteres",
    "must be longer than or equal to 8 characters": "La contraseña debe tener al menos 8 caracteres",
    "should not be empty": "Este campo es obligatorio",
    "must be a string": "Valor inválido en uno de los campos",
  };
  for (const [key, value] of Object.entries(map)) {
    if (msg.includes(key)) return value;
  }
  return msg;
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
      const backendMsg = error.response?.data?.message;
      if (backendMsg) {
        const first = Array.isArray(backendMsg) ? backendMsg[0] : backendMsg;
        return first;
      }
      return "Sesión expirada. Por favor, inicia sesión nuevamente.";
    }

    const backendMessage = error.response?.data?.message;
    if (backendMessage) {
      const msg = Array.isArray(backendMessage) ? backendMessage[0] : backendMessage;
      return translateValidationMessage(String(msg));
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
