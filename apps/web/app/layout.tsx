import type { Metadata } from 'next';
import type { CSSProperties } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { PageTransition } from '@/components/PageTransition';
import { fraunces, ibmPlex } from '@/lib/fonts';
import { AuthProvider } from '@/lib/auth-context';
import { NotificationProvider } from '@/lib/notification-context';
import { Toaster } from 'react-hot-toast';
import { LiveNotificationToast } from '@/components/LiveNotificationToast';
import { MOTION } from '@/lib/motion';
import './globals.css';

export const metadata: Metadata = {
  title: "Sakany — Logement étudiant près d'ESPRIT",
  description:
    'Trouve une chambre, un studio ou un appartement près du campus ESPRIT à Ariana. Location mensuelle, contact direct par téléphone.',
  openGraph: {
    title: "Sakany — Logement étudiant près d'ESPRIT",
    description: 'Trouve une chambre, un studio ou un appartement près du campus ESPRIT à Ariana.',
    url: 'https://sakany.tn',
    siteName: 'Sakany',
    locale: 'fr_TN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Sakany — Logement étudiant près d'ESPRIT",
    description: 'Trouve une chambre, un studio ou un appartement près du campus ESPRIT.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${fraunces.variable} ${ibmPlex.variable}`} suppressHydrationWarning>
      <body
        className="min-h-screen"
        suppressHydrationWarning
        style={
          {
            '--motion-fast': `${MOTION.duration.fast}ms`,
            '--motion-base': `${MOTION.duration.base}ms`,
            '--motion-slow': `${MOTION.duration.slow}ms`,
            '--motion-shimmer': `${MOTION.duration.shimmer}ms`,
            '--motion-ease-out': MOTION.easing.out,
            '--motion-ease-in-out': MOTION.easing.inOut,
          } as CSSProperties
        }
        >
        <AuthProvider>
          <NotificationProvider>
            <Toaster position="bottom-right" />
            <LiveNotificationToast />
            <Header />
            <main>
              <PageTransition>{children}</PageTransition>
            </main>
            <Footer />
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
