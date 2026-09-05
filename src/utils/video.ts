// Helper to parse any YouTube URL (watch, shorts, youtu.be) into an embeddable URL

export function toYouTubeEmbedUrl(url?: string): string | null {
  if (!url) return null;
  
  // Clean markdown brackets if passed from markdown
  const cleanUrl = url.replace(/^[\[\(]+|[\]\)]+$/g, '').trim();

  // youtu.be/ID
  const shortMatch = cleanUrl.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}?enablejsapi=1`;

  // youtube.com/shorts/ID
  const shortsMatch = cleanUrl.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/);
  if (shortsMatch) return `https://www.youtube.com/embed/${shortsMatch[1]}?enablejsapi=1`;

  // youtube.com/watch?v=ID
  const watchMatch = cleanUrl.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/);
  if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}?enablejsapi=1`;

  // Already embed URL
  if (cleanUrl.includes('youtube.com/embed/')) return cleanUrl;

  return null;
}

