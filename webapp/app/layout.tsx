import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import NavigationTracker from '../components/NavigationTracker'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'SAPAA - Stewards Helping Stewards',
  description: 'Monitor and track site inspections across Alberta\'s protected areas',
  icons: {
    icon: '/images/sapaa-icon.png',
    apple: '/images/sapaa-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NavigationTracker />
        {children}
      </body>
    </html>
  )
}