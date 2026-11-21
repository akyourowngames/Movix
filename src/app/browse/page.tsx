import type { Metadata } from 'next'
import BrowseClient from './BrowseClient'
import { getCatalogPage } from '@/lib/catalogQuery'
import {
  browsePathFor,
  categoryForMedia,
  parseCategoryMedia,
  supportsCategory,
  type CategoryMedia,
} from '@/lib/categories'
import { SITE_NAME } from '@/lib/site'

interface BrowsePageProps {
  searchParams: {
    type?: string
    category?: string
    page?: string
  }
}

const MEDIA_LABEL: Record<CategoryMedia, string> = {
  all: 'Movies & Series',
  movie: 'Movies',
  tv: 'Web Series',
}

const resolveBrowseParams = (searchParams: BrowsePageProps['searchParams']) => {
  let type = parseCategoryMedia(searchParams.type, 'all')
  let category = categoryForMedia(searchParams.category)

  if (!supportsCategory(category, type)) {
    type = 'all'
    if (!supportsCategory(category, type)) category = categoryForMedia('trending')
  }

  const page = Math.min(Math.max(Number(searchParams.page) || 1, 1), 20)

  return { type, category, page }
}

export async function generateMetadata({
  searchParams,
}: BrowsePageProps): Promise<Metadata> {
  const { type, category, page } = resolveBrowseParams(searchParams)
  const mediaLabel = MEDIA_LABEL[type]
  const baseTitle = `${category.label} — ${mediaLabel}`
  const title = page > 1 ? `${baseTitle} (Page ${page})` : baseTitle
  const blurb = category.blurb ?? `Discover ${category.label.toLowerCase()} titles`
  const description = `${blurb}. Explore ${mediaLabel.toLowerCase()} on ${SITE_NAME} with ratings, posters and streaming details.`
  const canonical = browsePathFor(type, category.id, page)

  return {
    title,
    description,
    keywords: [category.label, mediaLabel, 'watch online', SITE_NAME],
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      type: 'website',
      locale: 'en_IN',
    },
    twitter: { card: 'summary_large_image', title, description },
    robots: { index: true, follow: true },
  }
}

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const { type, category, page } = resolveBrowseParams(searchParams)
  const result = await getCatalogPage({ type, categoryId: category.id, page })
  const initial = result.ok ? result.page : null

  return (
    <BrowseClient
      initialType={type}
      initialCategoryId={category.id}
      initialPage={page}
      initialItems={initial?.items ?? []}
      initialTotalPages={initial?.totalPages ?? 0}
      initialTotalResults={initial?.totalResults ?? 0}
      initialError={!result.ok}
    />
  )
}
