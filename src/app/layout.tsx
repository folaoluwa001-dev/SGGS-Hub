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
      --primary: ${schoolConfig.schoolColors.primary};
      --primary-light: ${schoolConfig.schoolColors.primaryLight};
      --secondary: ${schoolConfig.schoolColors.secondary};
      --accent: ${schoolConfig.schoolColors.accent};
      --accent-light: ${schoolConfig.schoolColors.accentLight};
      --success: ${schoolConfig.schoolColors.success};
      --warning: ${schoolConfig.schoolColors.warning};
      --danger: ${schoolConfig.schoolColors.danger};
    }
  `;

  const themeInitScript = `
    (function() {
      try {
        var stored = localStorage.getItem('sggs-theme');
        var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        var theme = stored ? stored : (systemDark ? 'dark' : 'light');
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
          document.documentElement.style.colorScheme = 'dark';
        } else {
          document.documentElement.classList.remove('dark');
          document.documentElement.style.colorScheme = 'light';
        }
      } catch (e) {}
    })();
  `;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <style dangerouslySetInnerHTML={{ __html: styleString }} />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="theme-color" content={schoolConfig.schoolColors.primary} />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="antialiased bg-bg-custom text-fg-custom">
        <Providers>
          <PWARegister />
          {children}
        </Providers>
      </body>
    </html>
  );
}
