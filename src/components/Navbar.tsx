'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, Bookmark, Film, LogOut, Search, Settings2, UserRound } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/components/AuthProvider'
import { useLanguage } from '@/components/LanguageProvider'
import LanguageToggle from '@/components/LanguageToggle'

export default function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false)
    const [searchFocused, setSearchFocused] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [menuOpen, setMenuOpen] = useState(false)
    const [signOutError, setSignOutError] = useState(false)
    const [signingOut, setSigningOut] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)
    const router = useRouter()
    const { user, profile, loading, signOut } = useAuth()
    const { language } = useLanguage()
    const l = (en: string, hi: string) => (language === 'hi' ? hi : en)

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    useEffect(() => {
        if (!menuOpen) return

        const handleClick = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [menuOpen])

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        if (searchQuery.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
            setSearchQuery('')
            setSearchFocused(false)
        }
    }

    const handleSearchIconClick = () => {
        if (searchQuery.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
            setSearchQuery('')
            setSearchFocused(false)
        } else {
            setSearchFocused(true)
        }
    }

    const handleSignOut = async () => {
        if (signingOut) return
        setSigningOut(true)
        setSignOutError(false)
        try {
            await signOut()
            setMenuOpen(false)
            router.push('/')
            router.refresh()
        } catch {
            setSignOutError(true)
        } finally {
            setSigningOut(false)
        }
    }

    const displayName =
        profile?.display_name || user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Account'
    const initial = (displayName[0] || 'U').toUpperCase()

    return (
        <nav aria-label={l('Primary navigation', 'मुख्य नेविगेशन')} className={`fixed top-0 w-full z-50 border-b transition-colors duration-200 pointer-events-auto ${isScrolled ? 'glassmorphism border-b-white/10 py-3' : 'border-transparent bg-gradient-to-b from-black/70 to-transparent py-4'
            }`}>
            <div className="page-shell flex min-h-12 items-center justify-between gap-4">
                {/* Logo and Nav Links */}
                <div className="flex min-w-0 items-center gap-8 xl:gap-12">
                    <Link href="/" className="group flex shrink-0 items-center gap-2 sm:gap-2.5">
                        <Film className="h-6 w-6 text-primary sm:h-7 sm:w-7" />
                        <span className="font-display text-lg font-bold tracking-tight text-primary sm:text-xl md:text-2xl">
                            CineHindi
                        </span>
                        <span className="hidden pb-1 text-[10px] uppercase tracking-[0.3em] text-muted-foreground sm:block self-end">
                            सिनेमाघर
                        </span>
                    </Link>

                    <div className="hidden md:flex items-center gap-6 text-[13px] font-semibold lg:gap-8">
                        <Link href="/" className="text-white/70 hover:text-white transition-colors relative group">
                            {l('Home', 'होम')}
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
                        </Link>
                        <Link href="/browse" className="text-white/70 hover:text-white transition-colors relative group">
                            {l('Movies', 'फिल्में')}
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
                        </Link>
                        <Link href="/search" className="text-white/70 hover:text-white transition-colors relative group">
                            {l('Search', 'खोज')}
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
                        </Link>
                        <Link href="/profile" className="text-white/70 hover:text-white transition-colors relative group">
                            {l('My List', 'मेरी लिस्ट')}
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
                        </Link>
                    </div>
                </div>

                {/* Right Section */}
                <div className="flex shrink-0 items-center gap-1.5 sm:gap-3 lg:gap-5">
                    <div className="relative hidden sm:flex items-center">
                        <motion.div
                            initial={false}
                            animate={{ width: searchFocused ? 260 : 44 }}
                            className="flex h-11 items-center overflow-hidden rounded-full border border-white/10 bg-white/[0.04]"
                        >
                            <button
                                type="button"
                                onClick={handleSearchIconClick}
                                className="ml-1 inline-flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-transparent p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                aria-label={l('Search', 'खोज')}
                            >
                                <Search className="w-4 h-4 text-white/50 hover:text-white transition-colors" />
                            </button>
                            <form onSubmit={handleSearch} className="flex-1">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={l('Search movies...', 'फिल्में खोजें...')}
                                    className="w-full bg-transparent border-none px-3 py-2 text-sm text-white outline-none placeholder:text-muted-foreground"
                                    onFocus={() => setSearchFocused(true)}
                                    onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                                />
                            </form>
                        </motion.div>
                    </div>

                    <Link
                        href="/search"
                        aria-label={l('Search', 'खोज')}
                        className="flex min-h-11 min-w-11 items-center justify-center rounded-full text-white/70 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:hidden"
                    >
                        <Search className="h-5 w-5" aria-hidden="true" />
                    </Link>

                    <LanguageToggle />

                    <Link href="/profile" className="relative hidden min-h-11 min-w-11 items-center justify-center rounded-full text-white/70 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:flex" aria-label={l('My list', 'मेरी लिस्ट')}>
                        <Bookmark className="h-5 w-5" />
                    </Link>

                    {loading ? (
                        <div className="h-9 w-9 rounded-full skeleton-surface" aria-label="Loading account" />
                    ) : user ? (
                        <div className="relative" ref={menuRef}>
                            <button
                                onClick={() => setMenuOpen((open) => !open)}
                                className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                                aria-label="Account menu"
                                aria-expanded={menuOpen}
                            >
                                <Avatar className="w-9 h-9 border-2 border-white/10 hover:border-primary/50 transition-colors">
                                    {profile?.avatar_url ? <AvatarImage src={profile.avatar_url} alt={displayName} /> : null}
                                    <AvatarFallback>{initial}</AvatarFallback>
                                </Avatar>
                            </button>

                            <AnimatePresence>
                                {menuOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 8, scale: 0.97 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 8, scale: 0.97 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute right-0 top-12 w-60 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/95 p-2 shadow-2xl backdrop-blur-xl"
                                    >
                                        <div className="border-b border-white/5 px-3 py-2.5">
                                            <p className="truncate text-sm font-semibold">{displayName}</p>
                                            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                                        </div>
                                        <Link
                                            href="/profile"
                                            onClick={() => setMenuOpen(false)}
                                            className="mt-1 flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-white/75 transition-colors hover:bg-white/5 hover:text-white"
                                        >
                                            <UserRound className="h-4 w-4" />
                                            {l('My profile', 'मेरा प्रोफ़ाइल')}
                                        </Link>
                                        <Link
                                            href="/account"
                                            onClick={() => setMenuOpen(false)}
                                            className="flex min-h-11 items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-white/75 transition-colors hover:bg-white/5 hover:text-white"
                                        >
                                            <Settings2 className="h-4 w-4" />
                                            {l('Account settings', 'अकाउंट सेटिंग्स')}
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={handleSignOut}
                                            disabled={signingOut}
                                            className="flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-white/75 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none"
                                        >
                                            <LogOut className="h-4 w-4" />
                                            {signingOut
                                                ? l('Signing out…', 'साइन आउट हो रहा है…')
                                                : l('Sign out', 'साइन आउट')}
                                        </button>
                                        {signOutError && (
                                            <p role="alert" className="flex items-start gap-2 px-3 py-2 text-xs text-amber-200">
                                                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                                                {l('Could not sign out. Please try again.', 'साइन आउट नहीं हो सका। फिर कोशिश करें।')}
                                            </p>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <Link
                            href="/login"
                            aria-label={l('Sign in', 'साइन इन')}
                            className="flex min-h-11 items-center gap-2 rounded-full border border-white/20 px-3 py-2 text-sm font-semibold text-white transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:px-4"
                        >
                            <UserRound className="h-4 w-4" />
                            <span className="hidden sm:inline">{l('Sign in', 'साइन इन')}</span>
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    )
}
