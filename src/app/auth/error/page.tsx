"use client";

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h1 className="mb-2 text-lg font-semibold text-red-600">Error de autenticación</h1>
        <p className="text-sm text-zinc-600">
          Ocurrió un problema al iniciar sesión con Google. Intenta nuevamente.
        </p>
      </div>
    </div>
  );
}

