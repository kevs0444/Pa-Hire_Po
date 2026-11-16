import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Pa-Hire Po — Job Explorer & Resume Studio',
    short_name: 'Pa-Hire Po',
    description:
      'Multi-board job search across LinkedIn, JobStreet, and Indeed with match scoring and AI Resume Studio.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f3f2ef',
    theme_color: '#0a66c2',
    icons: [
      {
        src: '/pa-hire-po-logo.jpg',
        sizes: '512x512',
        type: 'image/jpeg',
      },
      {
        src: '/pa-hire-po.ico',
        sizes: '256x256',
        type: 'image/x-icon',
      },
    ],
  };
}
