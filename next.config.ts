// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración para que Vercel y el App Router funcionen bien
  experimental: {
    appDir: true,
  },
  // Opcional, pero ayuda a la compatibilidad con el despliegue
  output: 'standalone', 
};

module.exports = nextConfig;