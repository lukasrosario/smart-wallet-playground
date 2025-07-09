import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from './components/navigation/Sidebar';
import { WAGMIProvider } from './context/WagmiContextProvider';
import { ConfigProvider } from './context/ConfigContext';
import { GlobalHeader } from './components/global/GlobalHeader';

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
      <body className="antialiased bg-black text-white">
        <ConfigProvider>
          <WAGMIProvider>
            <div className="flex h-screen overflow-hidden relative">
              {/* Sidebar */}
              <Sidebar />

              {/* Main Content Area */}
              <div className="flex-1 flex flex-col overflow-hidden relative lg:ml-0">
                {/* Page Content */}
                <main className="flex-1 overflow-auto">{children}</main>

                {/* Floating Global Header */}
                <GlobalHeader />
              </div>
            </div>
          </WAGMIProvider>
        </ConfigProvider>
      </body>
    </html>
  );
}
