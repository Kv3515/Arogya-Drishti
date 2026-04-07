import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { RootLayoutClient } from '@/components/RootLayoutClient';

export const metadata: Metadata = {
  title: 'Arogya Drishti — Military Medical Intelligence',
  description: 'Centralized medical intelligence platform for defence personnel',
  robots: 'noindex, nofollow',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Arogya Drishti',
  },
  icons: {
    icon: '/icons/app-icon.svg',
    apple: '/icons/app-icon.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#14B8A6',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-gray-50 text-gray-900 antialiased">
        <AuthProvider>
          <RootLayoutClient>{children}</RootLayoutClient>
        </AuthProvider>
      </body>
    </html>
  );
}
