// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // ELIMINA la propiedad 'domains'
    // domains: [
    //   'xpltmxwyzcubwyoefrlh.supabase.co',
    //   'cdn.builder.io',
    //   'images.unsplash.com',
    // ],
    domains: ['lh3.googleusercontent.com'],
    // AÑADE la propiedad 'remotePatterns'
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'xpltmxwyzcubwyoefrlh.supabase.co',
        // Opcional: puedes ser más específico con el pathname si solo quieres permitir subcarpetas
        // pathname: '/storage/v1/object/public/**', 
      },
      {
        protocol: 'https',
        hostname: 'cdn.builder.io',
        // pathname: '/api/v1/image/assets/**', // Ejemplo si quieres ser específico
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        // pathname: '/**', // Permite cualquier ruta en Unsplash para imágenes
      },
      // Añade patrones para cualquier otro dominio externo que utilices
    ],
  },
};

module.exports = nextConfig;
