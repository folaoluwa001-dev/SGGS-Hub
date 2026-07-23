import type { MetadataRoute } from 'next';
import { schoolConfig } from '../../config/school.config';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: schoolConfig.schoolName,
    short_name: 'SGGS Hub',
    description: `${schoolConfig.schoolName} - School Management System and Student Portal`,
    start_url: '/',
    scope: '/',
    id: '/',
    display: 'standalone',
    background_color: schoolConfig.schoolColors.primary,
    theme_color: schoolConfig.schoolColors.primary,
    orientation: 'any',
    categories: ['education', 'management'],
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
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
        purpose: 'any',
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
