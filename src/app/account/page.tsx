import type { Metadata } from 'next'
import AccountClient from './AccountClient'

export const metadata: Metadata = {
  title: 'Account settings',
  description: 'Manage your CineHindi profile, email, password, avatar and library data.',
  robots: { index: false, follow: false },
  alternates: { canonical: '/account' },
}

export default function AccountPage() {
  return <AccountClient />
}
