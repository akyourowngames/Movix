const BASE_URL = process.env.NEXT_PUBLIC_8STREAM_URL

interface PlaylistItem {
  title: string
  id: string
  file: string
}

interface MediaInfoResponse {
  success: boolean
  data?: {
    playlist: PlaylistItem[]
    key: string
  }
  message?: string
}

interface StreamResponse {
  success: boolean
  data?: {
    link: string
  }
  message?: string
}

/**
 * Get media info from 8StreamApi
 * Returns playlist with available audio tracks and encryption key
 */
export async function getMediaInfo(imdbId: string): Promise<MediaInfoResponse> {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/mediaInfo?id=${imdbId}`, {
      cache: 'no-store', // Always fetch fresh data
    })
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`)
    }
    
    return await res.json()
  } catch (error) {
    console.error('Failed to fetch media info:', error)
    return {
      success: false,
      message: 'Failed to fetch media info',
    }
  }
}

/**
 * Get actual stream URL from file and key
 * Returns m3u8 playlist URL
 */
export async function getStreamUrl(file: string, key: string): Promise<StreamResponse> {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/getStream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ file, key }),
      cache: 'no-store',
    })
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`)
    }
    
    return await res.json()
  } catch (error) {
    console.error('Failed to fetch stream URL:', error)
    return {
      success: false,
      message: 'Failed to fetch stream URL',
    }
  }
}

/**
 * Get Hindi stream URL (or fallback to first available)
 * This is the main function to use - handles the full flow
 */
export async function getHindiStream(
  imdbId: string
): Promise<{ success: boolean; url?: string; message?: string; language?: string }> {
  try {
    // Step 1: Get media info
    const mediaInfo = await getMediaInfo(imdbId)
    
    if (!mediaInfo.success || !mediaInfo.data) {
      return {
        success: false,
        message: mediaInfo.message || 'No media info available',
      }
    }

    const { playlist, key } = mediaInfo.data

    if (!playlist || playlist.length === 0) {
      return {
        success: false,
        message: 'No streams available',
      }
    }

    // Step 2: Find Hindi audio track (or fallback to first)
    let selectedTrack = playlist.find(
      (item) => item.title.toLowerCase().includes('hindi')
    )
    
    if (!selectedTrack) {
      // Fallback to first available track
      selectedTrack = playlist[0]
    }

    // Step 3: Get stream URL
    const streamData = await getStreamUrl(selectedTrack.file, key)
    
    if (!streamData.success || !streamData.data) {
      return {
        success: false,
        message: streamData.message || 'Failed to get stream URL',
      }
    }

    return {
      success: true,
      url: streamData.data.link,
      language: selectedTrack.title,
    }
  } catch (error) {
    console.error('Failed to get Hindi stream:', error)
    return {
      success: false,
      message: 'An error occurred while fetching stream',
    }
  }
}

/**
 * Get all available audio tracks for a media
 */
export async function getAvailableTracks(imdbId: string): Promise<PlaylistItem[]> {
  const mediaInfo = await getMediaInfo(imdbId)
  
  if (!mediaInfo.success || !mediaInfo.data) {
    return []
  }

  return mediaInfo.data.playlist
}
