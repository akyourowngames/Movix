'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Bell, Film } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'

export default function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false)
    const [searchFocused, setSearchFocused] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const router = useRouter()

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

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
            // If no query, just expand the search bar
            setSearchFocused(true)
        }
    }

    return (
        <nav className={`fixed top-0 w-full z-50 transition-all duration-300 pointer-events-auto ${isScrolled ? 'glassmorphism border-b-white/5 pb-4 pt-4' : 'bg-transparent pt-6 pb-4'
            }`}>
            <div className="container mx-auto px-6 max-w-7xl flex items-center justify-between">
                {/* Logo and Nav Links */}
                <div className="flex items-center gap-12">
                    <Link href="/" className="flex items-center gap-2 group">
                        <Film className="w-8 h-8 text-primary group-hover:rotate-180 transition-transform duration-700" />
                        <span className="font-display text-2xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/70">
                            सिनेमाघर
                        </span>
                    </Link>

                    <div className="hidden md:flex items-center gap-8 text-sm font-medium">
                        <Link href="/" className="text-white/70 hover:text-white transition-colors relative group">
                            होम
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
                        </Link>
                        <Link href="/browse" className="text-white/70 hover:text-white transition-colors relative group">
                            फ़िल्में
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
                        </Link>
                        <Link href="/search" className="text-white/70 hover:text-white transition-colors relative group">
                            खोजें
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
                        </Link>
                        <Link href="/profile" className="text-white/70 hover:text-white transition-colors relative group">
                            प्रोफ़ाइल
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
                        </Link>
                    </div>
                </div>

                {/* Right Section */}
                <div className="flex items-center gap-6">
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

                    <button className="relative">
                        <Bell className="w-5 h-5 text-white/70 hover:text-white transition-colors" />
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full"></span>
                    </button>

                    <Link href="/profile">
                        <Avatar className="w-9 h-9 border-2 border-white/10 hover:border-primary/50 transition-colors cursor-pointer">
                            <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=user" />
                            <AvatarFallback>U</AvatarFallback>
                        </Avatar>
                    </Link>
                </div>
            </div>
        </nav>
    )
}
