'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell, Film, LogOut, Search, UserRound } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/components/AuthProvider'

export default function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false)
    const [searchFocused, setSearchFocused] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [menuOpen, setMenuOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)
    const router = useRouter()
    const { user, profile, loading, signOut } = useAuth()

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
        setMenuOpen(false)
        await signOut()
        router.push('/')
        router.refresh()
    }

    const displayName =
        profile?.display_name || user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Account'
    const initial = (displayName[0] || 'U').toUpperCase()

    return (
        <nav className={`fixed top-0 w-full z-50 transition-all duration-300 pointer-events-auto ${isScrolled ? 'glassmorphism border-b-white/5 pb-4 pt-4' : 'bg-transparent pt-6 pb-4'
            }`}>
            <div className="container mx-auto px-6 max-w-7xl flex items-center justify-between">
                {/* Logo and Nav Links */}
                <div className="flex items-center gap-12">
                    <Link href="/" className="flex items-center gap-2 group">
                        <Film className="w-8 h-8 text-primary group-hover:rotate-180 transition-transform duration-700" />
                        <span className="font-display text-2xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/70">
                            CineHindi
                        </span>
                        <span className="hidden sm:block text-[10px] uppercase tracking-[0.3em] text-white/40 self-end pb-1">
                            सिनेमाघर
                        </span>
                    </Link>

                    <div className="hidden md:flex items-center gap-8 text-sm font-medium">
                        <Link href="/" className="text-white/70 hover:text-white transition-colors relative group">
                            Home
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
                        </Link>
                        <Link href="/browse" className="text-white/70 hover:text-white transition-colors relative group">
                            Movies
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
                        </Link>
                        <Link href="/search" className="text-white/70 hover:text-white transition-colors relative group">
                            Search
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
                        </Link>
                        <Link href="/profile" className="text-white/70 hover:text-white transition-colors relative group">
                            My List
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
                        </Link>
                    </div>
                </div>

                {/* Right Section */}
                <div className="flex items-center gap-4 sm:gap-6">
                    <div className="relative hidden sm:flex items-center">
                        <motion.div
                            initial={false}
                            animate={{ width: searchFocused ? 240 : 36 }}
                            className="flex items-center bg-white/5 border border-white/10 rounded-full overflow-hidden"
                        >
                            <button
                                type="button"
                                onClick={handleSearchIconClick}
                                className="ml-3 shrink-0 cursor-pointer p-0 bg-transparent border-none"
                                aria-label="Search"
                            >
                                <Search className="w-4 h-4 text-white/50 hover:text-white transition-colors" />
                            </button>
                            <form onSubmit={handleSearch} className="flex-1">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search movies..."
                                    className="w-full bg-transparent border-none outline-none text-sm px-3 py-2 text-white placeholder:text-white/40"
                                    onFocus={() => setSearchFocused(true)}
                                    onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                                />
                            </form>
                        </motion.div>
                    </div>

                    <button className="relative" aria-label="Notifications">
                        <Bell className="w-5 h-5 text-white/70 hover:text-white transition-colors" />
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full"></span>
                    </button>

                    {loading ? (
                        <div className="w-9 h-9 rounded-full bg-white/5 animate-pulse" />
                    ) : user ? (
                        <div className="relative" ref={menuRef}>
                            <button
                                onClick={() => setMenuOpen((open) => !open)}
                                className="cursor-pointer rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
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
                                            <p className="truncate text-xs text-white/40">{user.email}</p>
                                        </div>
                                        <Link
                                            href="/profile"
                                            onClick={() => setMenuOpen(false)}
                                            className="mt-1 flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-white/75 transition-colors hover:bg-white/5 hover:text-white"
                                        >
                                            <UserRound className="h-4 w-4" />
                                            My profile
                                        </Link>
                                        <button
                                            onClick={handleSignOut}
                                            className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-white/75 transition-colors hover:bg-white/5 hover:text-white"
                                        >
                                            <LogOut className="h-4 w-4" />
                                            Sign out
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <Link
                            href="/login"
                            className="flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white/80 transition-colors hover:border-primary/50 hover:bg-white/10 hover:text-white"
                        >
                            <UserRound className="h-4 w-4" />
                            <span className="hidden sm:inline">Sign in</span>
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    )
}
