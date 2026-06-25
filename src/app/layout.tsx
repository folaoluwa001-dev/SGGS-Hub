import type { Metadata } from 'next';
import { schoolConfig } from '../../config/school.config';
import { Providers } from '@/components/Providers';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: schoolConfig.schoolName,
    template: `%s | ${schoolConfig.schoolName}`,
  },
  description: `${schoolConfig.schoolName} - school management system and student portal. Motto: ${schoolConfig.schoolMotto}`,
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: schoolConfig.schoolName,
    statusBarStyle: 'default',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const styleString = `
    :root {
      --primary: ${schoolConfig.schoolColors.primary};
      --primary-light: ${schoolConfig.schoolColors.primaryLight};
      --secondary: ${schoolConfig.schoolColors.secondary};
      --accent: ${schoolConfig.schoolColors.accent};
      --accent-light: ${schoolConfig.schoolColors.accentLight};
      --success: ${schoolConfig.schoolColors.success};
      --warning: ${schoolConfig.schoolColors.warning};
      --danger: ${schoolConfig.schoolColors.danger};
    }
    .dark {
      --background: #0b111e;
      --foreground: #f8fafc;
      --card: #151f32;
      --card-foreground: #f8fafc;
      --popover: #151f32;
      --popover-foreground: #f8fafc;
      --muted: #1e2e4a;
      --muted-foreground: #94a3b8;
      --border: #1e2e4a;
      --input: #1e2e4a;
      --ring: var(--secondary);
    }
  `;

  return (
    <html lang="en">
      <head>
        <style dangerouslySetInnerHTML={{ __html: styleString }} />
        <link rel="apple-touch-icon" href="/assets/icon-192x192.png" />
        <meta name="theme-color" content={schoolConfig.schoolColors.primary} />
      </head>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
