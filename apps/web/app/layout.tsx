import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { fraunces, ibmPlex } from '@/lib/fonts';
import { AuthProvider } from '@/lib/auth-context';
import './globals.css';

export const metadata: Metadata = {
  title: "Sakany — Logement étudiant près d'ESPRIT",
  description:
    'Trouve une chambre, un studio ou un appartement près du campus ESPRIT à Ariana. Location mensuelle, contact direct par téléphone.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${fraunces.variable} ${ibmPlex.variable}`} suppressHydrationWarning>
      <body className="min-h-screen" suppressHydrationWarning>
        <AuthProvider>
          <Header />
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
