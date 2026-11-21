import type { Metadata } from 'next'
import ResetPasswordForm from '@/components/auth/ResetPasswordForm'

export const metadata: Metadata = {
  title: 'Choose a new password',
  description: 'Set a new password for your CineHindi account.',
  robots: { index: false, follow: false },
  alternates: { canonical: '/reset-password' },
}

export default function ResetPasswordPage() {
  return <ResetPasswordForm />
}
