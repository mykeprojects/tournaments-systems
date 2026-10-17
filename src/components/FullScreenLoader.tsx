import React from "react";

interface FullScreenLoaderProps {
  message?: string;
}

export const FullScreenLoader: React.FC<FullScreenLoaderProps> = ({
  message = "Cargando...",
}) => {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#07110d] text-white">
      <div className="relative flex items-center justify-center">
        {/* Anillo de fondo */}
        <div className="h-12 w-12 rounded-full border-2 border-lime-400/20" />
        {/* Spinner giratorio */}
        <div className="absolute h-12 w-12 animate-spin rounded-full border-2 border-transparent border-t-lime-400" />
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
        {message}
      </p>
    </div>
  );
};

export default FullScreenLoader;