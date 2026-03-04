import dynamic from "next/dynamic";

export const MapSelector = dynamic(
  () => import("./map-selector"),
  { 
    ssr: false,
    loading: () => (
      <div className="h-[400px] w-full rounded-md border bg-muted animate-pulse flex items-center justify-center">
        <p className="text-muted-foreground">Cargando mapa...</p>
      </div>
    )
  }
);
