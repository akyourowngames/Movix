import type { Metadata } from 'next'
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm'

export const metadata: Metadata = {
  title: 'Reset your password',
  description: 'Request a secure password reset link for your CineHindi account.',
  robots: { index: false, follow: false },
  alternates: { canonical: '/forgot-password' },
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />
}
