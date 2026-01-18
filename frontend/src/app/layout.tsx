import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Navigation } from "@/components/navigation"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Lead Builder + ATU Relocation",
  description: "Lead Management und Wohnungssuche für ATU Fachkräfte",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <div className="flex h-screen flex-col">
            {/* Header with Navigation */}
            <header className="flex items-center justify-between border-b px-4 py-2" data-testid="app_header">
              <div className="flex items-center gap-4">
                <h1 className="text-lg font-bold hidden md:block" data-testid="app_title">
                  Lead Builder
                </h1>
                <Navigation />
              </div>
              <ThemeToggle />
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-hidden" data-testid="app_main">
              {children}
            </main>
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
