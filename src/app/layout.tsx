import type { Metadata } from 'next';
import { schoolConfig } from '../../config/school.config';
import { Providers } from '@/components/Providers';
import { PWARegister } from '@/components/PWARegister';
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
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const styleString = `
    :root {
      color-scheme: dark;
      --primary: ${schoolConfig.schoolColors.primary};
      --primary-light: ${schoolConfig.schoolColors.primaryLight};
      --secondary: ${schoolConfig.schoolColors.secondary};
      --accent: ${schoolConfig.schoolColors.accent};
      --accent-light: ${schoolConfig.schoolColors.accentLight};
      --success: ${schoolConfig.schoolColors.success};
      --warning: ${schoolConfig.schoolColors.warning};
      --danger: ${schoolConfig.schoolColors.danger};
      --background: #0b111e;
      --foreground: #ffffff;
      --card: #151f32;
      --card-foreground: #ffffff;
      --popover: #151f32;
      --popover-foreground: #ffffff;
      --muted: #1e2e4a;
      --muted-foreground: #cbd5e1;
      --border: #1e2e4a;
      --input: #1e2e4a;
      --ring: var(--secondary);
    }
    .dark {
      color-scheme: dark;
      --background: #0b111e;
      --foreground: #ffffff;
      --card: #151f32;
      --card-foreground: #ffffff;
      --popover: #151f32;
      --popover-foreground: #ffffff;
      --muted: #1e2e4a;
      --muted-foreground: #cbd5e1;
      --border: #1e2e4a;
      --input: #1e2e4a;
      --ring: var(--secondary);
    }
  `;

  return (
    <html lang="en" className="dark">
      <head>
        <meta name="color-scheme" content="dark" />
        <style dangerouslySetInnerHTML={{ __html: styleString }} />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="theme-color" content={schoolConfig.schoolColors.primary} />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="dark bg-[#0b111e] text-[#f8fafc] antialiased">
        <Providers>
          <PWARegister />
          {children}
        </Providers>
      </body>
    </html>
  );
}
