export function validateVideoUrls(videos, subject = 'Videos') {
  if (videos === undefined) return null;
  if (!Array.isArray(videos)) return `${subject} must be a list of video URLs.`;
  if (videos.length > 10) return `${subject} can contain up to 10 videos.`;

  const isValidVideoUrl = (value) => {
    if (typeof value !== 'string') return false;
    try {
      const url = new URL(value);
      if (!['http:', 'https:'].includes(url.protocol)) return false;

      // Direct video file
      if (/\.(mp4|webm|ogg)$/i.test(url.pathname)) return true;

      // YouTube: watch, short URL, or embed
      if (
        url.hostname.includes('youtube.com') ||
        url.hostname === 'youtu.be'
      ) {
        if (url.hostname === 'youtu.be' && url.pathname.length > 1) return true;
        if (url.hostname.includes('youtube.com')) {
          if (url.searchParams.get('v')) return true;
          if (url.pathname.startsWith('/embed/') && url.pathname.length > 7) return true;
        }
        return false;
      }

      // Vimeo: main site or player embed
      if (
        url.hostname === 'vimeo.com' ||
        url.hostname === 'player.vimeo.com'
      ) {
        return /\/\d+/.test(url.pathname);
      }

      return false;
    } catch {
      return false;
    }
  };

  const invalid = videos.some((value) => !isValidVideoUrl(value));
  return invalid
    ? `${subject} must use direct MP4/WebM/OGG URLs, YouTube watch/embed links, or Vimeo links.`
    : null;
}
