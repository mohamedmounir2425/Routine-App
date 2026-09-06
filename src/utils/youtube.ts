/**
 * YouTube Embed & Video Utilities
 * Handles URL extraction, parameter optimization, autoplay, mute, and looping for Workout Player.
 */

/**
 * Extracts a YouTube Video ID from any standard YouTube URL (embed, youtu.be, watch?v=)
 */
export function extractYoutubeVideoId(url: string): string | null {
  if (!url) return null;
  // Matches youtu.be/ID, youtube.com/embed/ID, youtube.com/watch?v=ID, or direct ID
  const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/;
  const match = url.match(regExp);
  if (match && match[1]) return match[1];

  // If already an 11-character video ID
  if (/^[\w-]{11}$/.test(url.trim())) {
    return url.trim();
  }

  return null;
}

/**
 * Builds an optimized embed URL for the Workout Player with autoplay, mute, and looping support.
 */
export function buildWorkoutVideoUrl(
  rawUrl: string,
  options: {
    autoplay?: boolean;
    mute?: boolean;
    loop?: boolean;
  } = {}
): string {
  if (!rawUrl) return '';
  const videoId = extractYoutubeVideoId(rawUrl);

  // If we couldn't extract an ID, return raw URL as fallback
  if (!videoId) return rawUrl;

  const { autoplay = true, mute = true, loop = true } = options;

  const params = new URLSearchParams();
  params.set('enablejsapi', '1');

  if (autoplay) {
    params.set('autoplay', '1');
  }

  if (mute) {
    // Mute is essential for browser autoplay policies without prior gesture
    params.set('mute', '1');
  }

  if (loop) {
    params.set('loop', '1');
    // YouTube single video loop requires playlist param set to videoId
    params.set('playlist', videoId);
  }

  // Optimize player UI for workout player
  params.set('rel', '0');
  params.set('modestbranding', '1');
  params.set('playsinline', '1');

  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}
