import React from "react"
import type { Metadata } from 'next'
import { Host_Grotesk, EB_Garamond } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import { AppProviders } from '@/app/providers'
import './globals.css'

const hostGrotesk = Host_Grotesk({ subsets: ["latin"], variable: "--font-host-grotesk" });
const contractSerif = EB_Garamond({
  subsets: ["latin"],
  variable: "--font-contract-serif",
})

export const metadata: Metadata = {
  title: 'Wheelio | Compare rental cars in Tunisia',
  description: 'Compare rental cars from trusted local agencies across Tunisia. Clear prices, flexible filters, and simple booking.',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${hostGrotesk.variable} ${contractSerif.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AppProviders>{children}</AppProviders>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
