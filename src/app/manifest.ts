import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Supplai - Pedidos por Voz',
    short_name: 'Supplai',
    description: 'Automatiza tus pedidos a proveedores con voz',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#8B5CF6',
    orientation: 'portrait-primary',
    categories: ['business', 'productivity'],
    lang: 'es',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
