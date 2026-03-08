import type { Metadata } from 'next'
import { Playfair_Display, DM_Sans } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  weight: ['400', '500', '600', '700', '800', '900']
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  weight: ['400', '500', '700']
})

export const metadata: Metadata = {
  title: 'CineHindi | सिनेमाघर - Premium Movies',
  description: 'Duniya ki best Hindi films, ek jagah. Dark luxury cinematic streaming platform.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${playfair.variable} ${dmSans.variable} font-sans antialiased bg-background text-foreground min-h-screen selection:bg-primary/30 selection:text-white`}>
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  )
}
