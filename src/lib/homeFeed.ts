import type { HeroMovie } from '@/components/HeroSection'
import type { Movie } from '@/lib/data'
import {
  getDiscoverMovies,
  getDiscoverTV,
  getNowPlaying,
  getOnTheAir,
  getTopRatedMovies,
  getTopRatedTV,
  getTrendingMoviesDay,
  getTrendingMoviesWeek,
  getTrendingTVDay,
  type TMDBMovie,
} from '@/lib/tmdb'
import {
  ageDaysFor,
  computeSignals,
  dedupe,
  diversifyByGenre,
  ensureLanguageMix,
  interleave,
  isAcceptable,
  isTelevisionFriendly,
  normalizeTMDBItem,
  ROTATION_VERSION,
  rotateRanked,
  toRankedMovie,
  utcDateKey,
  type MediaType,
  type ScorableItem,
  type Signals,
} from '@/lib/recommend'

export interface HomeRow {
  key: string
  title: string
  hindiTitle: string
  subtitle?: string
  variant?: 'default' | 'ranked'
  movies: Movie[]
}

export interface HomeFeed {
  hero: HeroMovie[]
  rows: HomeRow[]
}

type Weights = (signals: Signals) => number

const toResults = (response: { results?: TMDBMovie[] } | null) =>
  (response?.results || []) as TMDBMovie[]

const withScores = (items: ScorableItem[], nowMs: number, weights: Weights) =>
  items.map((item) => {
    const signals = computeSignals(item, nowMs)
    return { ...item, score: weights(signals) }
  })

const byScore = (a: ScorableItem, b: ScorableItem) =>
  (b.score ?? 0) - (a.score ?? 0) || a.id - b.id

const keyOf = (item: ScorableItem) => `${item.mediaType}:${item.id}`

const mixWithCaps = (sorted: ScorableItem[], count: number, maxPerType = 6) => {
  const picked: ScorableItem[] = []
  const counts: Record<MediaType, number> = { movie: 0, tv: 0 }

  for (const item of sorted) {
    if (counts[item.mediaType] >= maxPerType) continue
    picked.push(item)
    counts[item.mediaType] += 1
    if (picked.length === count) return picked
  }

  for (const item of sorted) {
    if (picked.length === count) break
    if (!picked.includes(item)) picked.push(item)
  }

  return picked
}

const toMovies = (items: ScorableItem[], nowMs: number, ranked = false) =>
  items.map((item, index) => toRankedMovie(item, nowMs, ranked ? index + 1 : undefined))

const emptyFeed: HomeFeed = { hero: [], rows: [] }

export const getHomeFeed = async (now: Date = new Date()): Promise<HomeFeed> => {
  try {
    const nowMs = now.getTime()
    const today = now.toISOString().slice(0, 10)
    const daysAgo = (days: number) =>
      new Date(nowMs - days * 86_400_000).toISOString().slice(0, 10)

    const [
      movieTrendRes,
      tvTrendRes,
      nowPlayingRes,
      onAirRes,
      hiMovieRes,
      hiTvRes,
      topMovieRes,
      topTvRes,
      gemMovieRes,
      gemTvRes,
      bollyRes,
      indianTvRes,
      southRes,
      hollyRes,
      kdramaRes,
      animeRes,
      actionRes,
      comedyRes,
    ] = await Promise.all([
      getTrendingMoviesDay(),
      getTrendingTVDay(),
      getNowPlaying(),
      getOnTheAir(),
      getDiscoverMovies({
        with_original_language: 'hi',
        'primary_release_date.lte': today,
        'primary_release_date.gte': daysAgo(75),
        'vote_count.gte': 5,
        sort_by: 'popularity.desc',
        page: 1,
      }),
      getDiscoverTV({
        with_original_language: 'hi',
        'first_air_date.lte': today,
        'first_air_date.gte': daysAgo(120),
        'vote_count.gte': 3,
        sort_by: 'popularity.desc',
        page: 1,
      }),
      getTopRatedMovies(),
      getTopRatedTV(),
      getDiscoverMovies({
        'vote_average.gte': 7,
        'vote_count.gte': 80,
        'vote_count.lte': 900,
        sort_by: 'vote_average.desc',
        page: 1,
      }),
      getDiscoverTV({
        'vote_average.gte': 7,
        'vote_count.gte': 50,
        'vote_count.lte': 700,
        sort_by: 'vote_average.desc',
        page: 1,
      }),
      getDiscoverMovies({
        with_original_language: 'hi',
        with_origin_country: 'IN',
        'primary_release_date.lte': today,
        'vote_count.gte': 20,
        sort_by: 'popularity.desc',
        page: 1,
      }),
      getDiscoverTV({
        with_origin_country: 'IN',
        'first_air_date.lte': today,
        'vote_count.gte': 5,
        sort_by: 'popularity.desc',
        page: 1,
      }),
      getDiscoverMovies({
        with_original_language: 'ta|te|ml|kn',
        with_origin_country: 'IN',
        'primary_release_date.lte': today,
        'vote_count.gte': 20,
        sort_by: 'popularity.desc',
        page: 1,
      }),
      getDiscoverMovies({
        with_original_language: 'en',
        'primary_release_date.lte': today,
        'vote_count.gte': 150,
        sort_by: 'popularity.desc',
        page: 1,
      }),
      getDiscoverTV({
        with_original_language: 'ko',
        with_origin_country: 'KR',
        'first_air_date.lte': today,
        'vote_count.gte': 10,
        sort_by: 'popularity.desc',
        page: 1,
      }),
      getDiscoverTV({
        with_genres: 16,
        with_original_language: 'ja',
        'first_air_date.lte': today,
        'vote_count.gte': 20,
        sort_by: 'popularity.desc',
        page: 1,
      }),
      getDiscoverMovies({
        with_genres: 28,
        'primary_release_date.lte': today,
        'vote_count.gte': 120,
        sort_by: 'popularity.desc',
        page: 1,
      }),
      getDiscoverMovies({
        with_genres: 35,
        'primary_release_date.lte': today,
        'vote_count.gte': 150,
        sort_by: 'popularity.desc',
        page: 1,
      }),
    ])

    let movieTrend = toResults(movieTrendRes)
    if (movieTrend.length === 0) {
      movieTrend = toResults(await getTrendingMoviesWeek())
    }

    const movieTrendItems = movieTrend.map((raw, index) =>
      normalizeTMDBItem(raw, 'movie', { trendIndex: index })
    )
    const tvTrendItems = toResults(tvTrendRes).map((raw, index) =>
      normalizeTMDBItem(raw, 'tv', { trendIndex: index })
    )
    const nowPlayingItems = toResults(nowPlayingRes).map((raw) =>
      normalizeTMDBItem(raw, 'movie', { inNowPlaying: true })
    )
    const onAirItems = toResults(onAirRes).map((raw, index) =>
      normalizeTMDBItem(raw, 'tv', { onAirIndex: index })
    )
    const hiMovieItems = toResults(hiMovieRes).map((raw) => normalizeTMDBItem(raw, 'movie'))
    const hiTvItems = toResults(hiTvRes).map((raw) => normalizeTMDBItem(raw, 'tv'))
    const topMovieItems = toResults(topMovieRes).map((raw) => normalizeTMDBItem(raw, 'movie'))
    const topTvItems = toResults(topTvRes).map((raw) => normalizeTMDBItem(raw, 'tv'))
    const gemMovieItems = toResults(gemMovieRes).map((raw) => normalizeTMDBItem(raw, 'movie'))
    const gemTvItems = toResults(gemTvRes).map((raw) => normalizeTMDBItem(raw, 'tv'))
    const bollyItems = toResults(bollyRes).map((raw) => normalizeTMDBItem(raw, 'movie'))
    const indianTvItems = toResults(indianTvRes).map((raw) => normalizeTMDBItem(raw, 'tv'))
    const southItems = toResults(southRes).map((raw) => normalizeTMDBItem(raw, 'movie'))
    const hollyItems = toResults(hollyRes).map((raw) => normalizeTMDBItem(raw, 'movie'))
    const kdramaItems = toResults(kdramaRes).map((raw) => normalizeTMDBItem(raw, 'tv'))
    const animeItems = toResults(animeRes).map((raw) => normalizeTMDBItem(raw, 'tv'))
    const actionItems = toResults(actionRes).map((raw) => normalizeTMDBItem(raw, 'movie'))
    const comedyItems = toResults(comedyRes).map((raw) => normalizeTMDBItem(raw, 'movie'))

    const all = dedupe([
      ...movieTrendItems,
      ...tvTrendItems,
      ...nowPlayingItems,
      ...onAirItems,
      ...hiMovieItems,
      ...hiTvItems,
      ...topMovieItems,
      ...topTvItems,
      ...gemMovieItems,
      ...gemTvItems,
    ]).filter((item) => isAcceptable(item, nowMs))

    const hindiBackfill = all.filter((item) => item.originalLanguage === 'hi')
    const seed = (key: string) => `${utcDateKey(now)}:${key}:${ROTATION_VERSION}`

    // 1) Top 10 Today — momentum + quality + freshness, capped per type
    const top10Pool = withScores(
      all.filter((item) => item.voteCount >= 50),
      nowMs,
      (s) =>
        0.4 * (s.trend > 0 ? s.trend : 0.3 * s.pop) +
        0.25 * s.quality +
        0.15 * s.pop +
        0.1 * s.fresh +
        0.1 * s.newness
    ).sort(byScore)

    const top10Mixed = mixWithCaps(top10Pool, 40, 24)
    const top10Items = ensureLanguageMix(
      rotateRanked(top10Mixed, 10, seed('top10')),
      hindiBackfill,
      2,
      seed('top10')
    )

    // Hero: strongest titles that have artwork
    const heroItems = top10Pool
      .filter((item) => item.backdropPath && item.overview)
      .slice(0, 5)
    const hero: HeroMovie[] = heroItems.map((item) => ({
      id: item.id,
      title: item.title,
      original_title: item.originalTitle,
      backdrop_path: item.backdropPath ?? null,
      overview: item.overview,
      media_type: item.mediaType,
    }))

    // 2) Trending Today — TMDB daily trend, movies interleaved with TV
    const trendScored = withScores(
      dedupe([...movieTrendItems, ...tvTrendItems]).filter((item) => isAcceptable(item, nowMs)),
      nowMs,
      (s) =>
        0.42 * s.trend +
        0.23 * s.quality +
        0.13 * s.pop +
        0.12 * s.fresh +
        0.1 * s.newness
    ).sort(byScore)

    const trendMovies = trendScored.filter((item) => item.mediaType === 'movie')
    const trendTv = trendScored.filter((item) => item.mediaType === 'tv')
    const trendingItems = ensureLanguageMix(
      interleave(trendMovies, trendTv, 3).slice(0, 20),
      hindiBackfill,
      2,
      seed('trending')
    )

    const claimed = new Set([...top10Items, ...trendingItems].map(keyOf))
    const preferUnclaimed = (items: ScorableItem[]) => {
      const unclaimed = items.filter((item) => !claimed.has(keyOf(item)))
      return unclaimed.length >= 8 ? unclaimed : items
    }

    // 3) Fresh Releases — newest first, 7-day buckets
    const freshPool = [...nowPlayingItems, ...onAirItems, ...hiMovieItems, ...hiTvItems]
      .filter((item) => isAcceptable(item, nowMs))
      .filter((item) => ageDaysFor(item, nowMs) <= 75)

    const freshItems = ensureLanguageMix(
      preferUnclaimed(
        withScores(
          freshPool,
          nowMs,
          (s) => 0.45 * s.newness + 0.25 * s.fresh + 0.2 * s.quality + 0.1 * s.pop
        ).sort((a, b) => {
          const bucketA = Math.floor(ageDaysFor(a, nowMs) / 7)
          const bucketB = Math.floor(ageDaysFor(b, nowMs) / 7)
          return bucketA - bucketB || byScore(a, b)
        })
      ).slice(0, 20),
      hindiBackfill,
      5,
      seed('fresh')
    )
    freshItems.forEach((item) => claimed.add(keyOf(item)))

    // 4) Best TV Right Now
    const tvPool = dedupe([...tvTrendItems, ...onAirItems, ...hiTvItems, ...topTvItems])
      .filter((item) => isAcceptable(item, nowMs))
      .filter(isTelevisionFriendly)

    const bestTvItems = preferUnclaimed(
      diversifyByGenre(
        withScores(
          tvPool,
          nowMs,
          (s) =>
            0.35 * s.quality + 0.25 * s.fresh + 0.2 * s.pop + 0.2 * s.onAirRank
        ).sort(byScore)
      )
    ).slice(0, 20)
    bestTvItems.forEach((item) => claimed.add(keyOf(item)))

    // 5) Top Rated Movies — IMDb-style weighted rating
    const topRatedItems = ensureLanguageMix(
      preferUnclaimed(
        withScores(
          topMovieItems.filter(
            (item) => isAcceptable(item, nowMs) && item.voteCount >= 1000
          ),
          nowMs,
          (s) => 0.7 * s.quality + 0.2 * s.pop + 0.1 * s.fresh
        ).sort(byScore)
      ).slice(0, 20),
      hindiBackfill,
      3,
      seed('top-rated')
    )
    topRatedItems.forEach((item) => claimed.add(keyOf(item)))

    // 6) Hidden Gems — strong scores, modest popularity
    const gemPool = dedupe([...gemMovieItems, ...gemTvItems])
      .filter((item) => isAcceptable(item, nowMs))
      .filter(
        (item) =>
          item.voteCount >= 80 &&
          item.voteCount <= 900 &&
          item.rating >= 7 &&
          ageDaysFor(item, nowMs) >= 60
      )

    const gemItems = preferUnclaimed(
      diversifyByGenre(
        withScores(
          gemPool,
          nowMs,
          (s) => 0.6 * s.quality + 0.25 * (1 - s.pop) + 0.15 * s.fresh
        ).sort(byScore)
      )
    ).slice(0, 18)
    gemItems.forEach((item) => claimed.add(keyOf(item)))

    // 7) Curated industry & genre rows
    const makeCategoryRow = (
      key: string,
      title: string,
      hindiTitle: string,
      subtitle: string,
      items: ScorableItem[]
    ): HomeRow => {
      const picked = preferUnclaimed(
        diversifyByGenre(
          withScores(
            items.filter((item) => isAcceptable(item, nowMs)),
            nowMs,
            (s) => 0.55 * s.pop + 0.3 * s.quality + 0.15 * s.fresh
          ).sort(byScore)
        )
      ).slice(0, 20)

      picked.forEach((item) => claimed.add(keyOf(item)))

      return { key, title, hindiTitle, subtitle, movies: toMovies(picked, nowMs) }
    }

    const industryRows = [
      makeCategoryRow(
        'bollywood',
        'Bollywood Blockbusters',
        'बॉलीवुड',
        'Hindi cinema, handpicked',
        bollyItems
      ),
      makeCategoryRow(
        'indian-series',
        'Indian Web Series',
        'भारतीय वेब सीरीज़',
        'Hindi & regional series',
        indianTvItems
      ),
      makeCategoryRow(
        'south-indian',
        'South Indian Hits',
        'साउथ सिनेमा',
        'Tamil · Telugu · Malayalam · Kannada',
        southItems
      ),
      makeCategoryRow(
        'hollywood',
        'Hollywood Blockbusters',
        'हॉलीवुड',
        'English-language favourites',
        hollyItems
      ),
      makeCategoryRow('kdrama', 'K-Dramas', 'के-ड्रामा', 'Korean series to binge', kdramaItems),
      makeCategoryRow('anime', 'Anime Spotlight', 'एनीमे', 'Japanese animation', animeItems),
      makeCategoryRow('action', 'Action Fix', 'एक्शन', 'High-octane picks', actionItems),
      makeCategoryRow('comedy', 'Comedy Nights', 'कॉमेडी', 'Laugh out loud', comedyItems),
    ].filter((row) => row.movies.length >= 8)

    const rows: HomeRow[] = [
      {
        key: 'top10',
        title: 'Top 10 Today',
        hindiTitle: 'आज टॉप 10',
        subtitle: 'Ranked daily',
        variant: 'ranked' as const,
        movies: toMovies(top10Items, nowMs, true),
      },
      {
        key: 'trending',
        title: 'Trending Today',
        hindiTitle: 'आज ट्रेंडिंग',
        subtitle: 'Refreshes daily',
        variant: 'ranked' as const,
        movies: toMovies(trendingItems, nowMs, true),
      },
      {
        key: 'fresh',
        title: 'Fresh Releases',
        hindiTitle: 'नई रिलीज़',
        subtitle: 'Recently released first',
        movies: toMovies(freshItems, nowMs),
      },
      {
        key: 'best-tv',
        title: 'Best TV Right Now',
        hindiTitle: 'बेस्ट वेब सीरीज़',
        movies: toMovies(bestTvItems, nowMs),
      },
      ...industryRows,
      {
        key: 'top-rated',
        title: 'Top Rated Movies',
        hindiTitle: 'टॉप रेटेड फिल्में',
        movies: toMovies(topRatedItems, nowMs),
      },
      {
        key: 'gems',
        title: 'Hidden Gems',
        hindiTitle: 'छुपे हुए रत्न',
        movies: toMovies(gemItems, nowMs),
      },
    ].filter((row) => row.movies.length >= 8)

    return { hero, rows }
  } catch {
    return emptyFeed
  }
}
