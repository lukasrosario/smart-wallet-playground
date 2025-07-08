import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Sidebar } from './components/navigation/Sidebar';
import { GlobalHeader } from './components/global/GlobalHeader';
import { WAGMIProvider } from './context/WagmiContextProvider';
import { ConfigProvider } from './context/ConfigContext';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Smart Wallet Playground',
  description: 'Smart Wallet Playground',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-900 text-white`}>
        <ConfigProvider>
          <WAGMIProvider>
            <div className="flex h-screen overflow-hidden">
              {/* Sidebar */}
              <Sidebar />

              {/* Main Content Area */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Global Header */}
                <GlobalHeader />

                {/* Page Content */}
                <main className="flex-1 overflow-auto p-6">{children}</main>
              </div>
            </div>
          </WAGMIProvider>
        </ConfigProvider>
      </body>
    </html>
  );
}
