import AuthForm from '@/components/AuthForm'

export const metadata = {
  title: 'Sign in',
  description: 'Sign in to sync your CineHindi watchlist, history and resume points.',
  robots: { index: false, follow: false },
}

export default function LoginPage() {
  return <AuthForm mode="login" />
}
