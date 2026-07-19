import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // La imagen OG lee las tipografías de `assets/` en tiempo de ejecución.
  // Next solo empaqueta lo que detecta leyendo rutas literales, y ahí el
  // nombre del archivo llega en una variable: sin esto, en Vercel no suben
  // y la imagen del preview truena.
  outputFileTracingIncludes: {
    "/i/[code]/opengraph-image": ["./assets/**"],
  },
};

export default nextConfig;
