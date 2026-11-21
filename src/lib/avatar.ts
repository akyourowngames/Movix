'use client'

import { getSupabase } from '@/lib/supabase/client'

const AVATAR_SIZE = 320
const MAX_SOURCE_BYTES = 6 * 1024 * 1024

const loadDrawable = async (file: File) => {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file)
    } catch {
      // Fall through to the HTMLImageElement path.
    }
  }

  const objectUrl = URL.createObjectURL(file)
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image()
      element.onload = () => resolve(element)
      element.onerror = () => reject(new Error('That image could not be read.'))
      element.src = objectUrl
    })
    return image
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

const avatarPathFromUrl = (url: string | null | undefined) => {
  if (!url) return null
  try {
    const path = new URL(url).pathname
    const marker = '/storage/v1/object/public/avatars/'
    const index = path.indexOf(marker)
    return index >= 0 ? decodeURIComponent(path.slice(index + marker.length)) : null
  } catch {
    return null
  }
}

export async function prepareAvatar(file: File) {
  if (!file.type.startsWith('image/')) {
    throw new Error('Choose a JPG, PNG or WebP image.')
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error('Choose an image smaller than 6MB.')
  }

  const drawable = await loadDrawable(file)
  const width = 'width' in drawable ? drawable.width : 0
  const height = 'height' in drawable ? drawable.height : 0
  if (!width || !height) throw new Error('That image could not be read.')

  const canvas = document.createElement('canvas')
  canvas.width = AVATAR_SIZE
  canvas.height = AVATAR_SIZE
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Your browser could not process that image.')

  const scale = Math.max(AVATAR_SIZE / width, AVATAR_SIZE / height)
  const drawWidth = width * scale
  const drawHeight = height * scale
  context.imageSmoothingQuality = 'high'
  context.drawImage(
    drawable,
    (AVATAR_SIZE - drawWidth) / 2,
    (AVATAR_SIZE - drawHeight) / 2,
    drawWidth,
    drawHeight
  )

  if ('close' in drawable) drawable.close()

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/webp', 0.86)
  })

  if (!blob) throw new Error('Your browser could not process that image.')
  return blob
}

export async function uploadAvatar({
  userId,
  file,
  previousUrl,
}: {
  userId: string
  file: File
  previousUrl?: string | null
}) {
  const supabase = getSupabase()
  if (!supabase) throw new Error('Accounts are not configured on this deployment.')

  const blob = await prepareAvatar(file)
  const extension =
    blob.type === 'image/png' ? 'png' : blob.type === 'image/jpeg' ? 'jpg' : 'webp'
  const path = `${userId}/avatar-${Date.now()}.${extension}`

  const { error: uploadError } = await supabase.storage.from('avatars').upload(path, blob, {
    contentType: blob.type || 'image/webp',
    cacheControl: '3600',
    upsert: false,
  })

  if (uploadError) throw new Error(uploadError.message)

  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  const avatarUrl = data.publicUrl

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (profileError) {
    await supabase.storage.from('avatars').remove([path])
    throw new Error('Your avatar uploaded but the profile could not be updated.')
  }

  const oldPath = avatarPathFromUrl(previousUrl)
  if (oldPath && oldPath !== path) {
    await supabase.storage.from('avatars').remove([oldPath])
  }

  return avatarUrl
}

export async function removeAvatar({
  userId,
  previousUrl,
}: {
  userId: string
  previousUrl?: string | null
}) {
  const supabase = getSupabase()
  if (!supabase) throw new Error('Accounts are not configured on this deployment.')

  const oldPath = avatarPathFromUrl(previousUrl)
  if (oldPath) {
    await supabase.storage.from('avatars').remove([oldPath])
  }

  const { error } = await supabase
    .from('profiles')
    .update({ avatar_url: null, updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (error) throw new Error('Could not remove your avatar. Please try again.')
}
