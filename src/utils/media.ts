export function getSafeExternalUrl(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

export function getSafeMediaUrl(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('/')) {
    return trimmed;
  }
  if (trimmed.startsWith('data:image/') || trimmed.startsWith('data:application/pdf')) {
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

export type ParsedVideo =
  | {
      kind: 'youtube';
      videoId: string;
      embedUrl: string;
      thumbnailUrl: string;
      originalUrl: string;
    }
  | {
      kind: 'mp4';
      src: string;
      originalUrl: string;
    };

export function parseDemoVideo(raw: string | undefined | null): ParsedVideo | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('data:video/')) {
    return {
      kind: 'mp4',
      src: trimmed,
      originalUrl: trimmed,
    };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return null;
  }

  const host = parsed.hostname.replace(/^www\./, '').toLowerCase();

  if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
    let videoId = parsed.searchParams.get('v') ?? '';
    if (!videoId && parsed.pathname.startsWith('/embed/')) {
      videoId = parsed.pathname.split('/embed/')[1]?.split('/')[0] ?? '';
    }
    if (!videoId && parsed.pathname.startsWith('/shorts/')) {
      videoId = parsed.pathname.split('/shorts/')[1]?.split('/')[0] ?? '';
    }
    if (!videoId && parsed.pathname.startsWith('/live/')) {
      videoId = parsed.pathname.split('/live/')[1]?.split('/')[0] ?? '';
    }
    if (/^[A-Za-z0-9_-]{6,20}$/.test(videoId)) {
      return {
        kind: 'youtube',
        videoId,
        embedUrl: `https://www.youtube.com/embed/${videoId}?rel=0`,
        thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        originalUrl: parsed.toString(),
      };
    }
  }

  if (host === 'youtu.be') {
    const videoId = parsed.pathname.replace(/^\//, '').split('/')[0] ?? '';
    if (/^[A-Za-z0-9_-]{6,20}$/.test(videoId)) {
      return {
        kind: 'youtube',
        videoId,
        embedUrl: `https://www.youtube.com/embed/${videoId}?rel=0`,
        thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        originalUrl: parsed.toString(),
      };
    }
  }

  // Direct MP4 / WebM / Ogg video link
  if (/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(parsed.pathname) || parsed.searchParams.get('mime')?.startsWith('video/')) {
    return {
      kind: 'mp4',
      src: parsed.toString(),
      originalUrl: parsed.toString(),
    };
  }

  // Fallback for direct hosted video URLs without extension if explicitly entered as video link
  return {
    kind: 'mp4',
    src: parsed.toString(),
    originalUrl: parsed.toString(),
  };
}

export function readFileAsDataUrl(file: File, maxBytes = 4 * 1024 * 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > maxBytes) {
      reject(new Error(`File exceeds ${Math.round(maxBytes / (1024 * 1024))}MB limit.`));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file.'));
      }
    };
    reader.onerror = () => reject(new Error('Unable to read selected file.'));
    reader.readAsDataURL(file);
  });
}
