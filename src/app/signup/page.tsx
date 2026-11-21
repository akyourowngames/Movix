import AuthForm from '@/components/AuthForm'

export const metadata = {
  title: 'Create account',
  description: 'Create a free CineHindi account to sync your watchlist and resume points.',
  robots: { index: false, follow: false },
}

export default function SignupPage() {
  return <AuthForm mode="signup" />
}
