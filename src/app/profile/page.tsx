'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Clock, Film, Heart, History, Play } from 'lucide-react'
import Link from 'next/link'

// Mock data - in real app, fetch from database
const MOCK_WATCHLIST = [
  { id: 1, title: 'Jawan', poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400', progress: 45 },
  { id: 2, title: 'Pathaan', poster: 'https://images.unsplash.com/photo-1594908900066-3f47337549d8?w=400', progress: 78 },
  { id: 3, title: 'Dunki', poster: 'https://images.unsplash.com/photo-1574267432644-f610f5b17752?w=400', progress: 23 },
]

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<'watchlist' | 'continue' | 'favorites' | 'history'>('continue')

  const tabs = [
    { id: 'watchlist', label: 'My Watchlist', hindi: 'मेरी वॉचलिस्ट', icon: Film },
    { id: 'continue', label: 'Continue Watching', hindi: 'देखना जारी रखें', icon: Play },
    { id: 'favorites', label: 'Favorites', hindi: 'पसंदीदा', icon: Heart },
    { id: 'history', label: 'Watch History', hindi: 'इतिहास', icon: History },
  ]

  return (
    <main className="min-h-screen bg-background pt-24 pb-32">
      <div className="container mx-auto px-6">
        {/* Profile Header */}
        <div className="flex items-center gap-6 mb-12">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-3xl font-bold">
            U
          </div>
          <div>
            <h1 className="font-display text-4xl font-bold mb-2">User Profile</h1>
            <p className="text-white/60">Member since March 2024</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Film className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold">127</p>
                <p className="text-sm text-white/60">Total Movies / कुल फिल्में</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold">342h</p>
                <p className="text-sm text-white/60">Total Hours / कुल घंटे</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Heart className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold">Action</p>
                <p className="text-sm text-white/60">Top Genre / पसंदीदा शैली</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-primary text-background'
                    : 'bg-white/5 text-white hover:bg-white/10'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                <span className="text-sm opacity-70">/ {tab.hindi}</span>
              </button>
            )
          })}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {MOCK_WATCHLIST.map((movie, index) => (
            <motion.div
              key={movie.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={`/movie/${movie.id}`}>
                <div className="group cursor-pointer">
                  <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-3 bg-white/5">
                    <img
                      src={movie.poster}
                      alt={movie.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    {activeTab === 'continue' && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${movie.progress}%` }}
                        />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play className="w-12 h-12 text-white" fill="white" />
                    </div>
                  </div>
                  <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                    {movie.title}
                  </h3>
                  {activeTab === 'continue' && (
                    <p className="text-xs text-white/60 mt-1">{movie.progress}% complete</p>
                  )}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {MOCK_WATCHLIST.length === 0 && (
          <div className="text-center py-20">
            <Film className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <p className="text-white/60 mb-4">No movies in your {activeTab} yet</p>
            <Link
              href="/browse"
              className="inline-block px-6 py-3 bg-primary text-background rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Browse Movies
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
