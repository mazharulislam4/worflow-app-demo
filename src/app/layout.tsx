
import { ReduxProvider } from "@/components/ui/redux-provider";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Workflow & Service Management",
  description: "Build workflows and manage services",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ReduxProvider>
          <div className="min-h-screen bg-background">
            {/* Navigation Header */}
            <nav className="bg-blue-600 shadow-sm border-b border-blue-700">
              <div className="max-w-7xl mx-auto px-4">
                <div className="flex justify-between items-center h-16">
                  <div className="flex items-center space-x-8">
                    <Link href="/" className="flex items-center space-x-2">
                      <img src="/logo.svg" alt="Logo" className="h-12 w-[200px]" />
                    </Link>
                    <div className="hidden md:flex items-center space-x-6">
                      <Link 
                        href="/workflows" 
                        className="text-white hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                      >
                        Workflows
                      </Link>
                      <Link 
                        href="/wf" 
                        className="text-white hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                      >
                        Workflow Builder
                      </Link>
                      <Link 
                        href="/form-builder" 
                        className="text-white hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                      >
                        Form Builder
                      </Link>
                      <Link 
                        href="/service-management" 
                        className="text-white hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                      >
                        Services
                      </Link>
                      <Link 
                        href="/requests" 
                        className="text-white hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                      >
                        Requests
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </nav>
            
            {/* Main Content */}
            <main>
              {children}
            </main>
          </div>
        </ReduxProvider>
      </body>
    </html>
  );
}
