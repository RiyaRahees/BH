const DEFAULT_FEMALE = 'https://www.w3schools.com/howto/img_avatar2.png';
const DEFAULT_MALE = 'https://www.w3schools.com/howto/img_avatar.png';

export const getDocumentUrl = (path) => {
  if (!path) return '';
  const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  let cleanPath = path.startsWith('/') ? path : '/' + path;
  
  if (isLocal) {
    if (cleanPath.startsWith('/api/uploads/')) {
      return `http://localhost:5000${cleanPath.replace('/api', '')}`;
    }
    return `http://localhost:5000${cleanPath}`;
  }
  
  // On production (cPanel Passenger mounted on /api)
  if (cleanPath.startsWith('/api/uploads/')) {
    return cleanPath;
  }
  if (cleanPath.startsWith('/uploads/')) {
    return `/api${cleanPath}`;
  }
  return `/api/uploads/${cleanPath.replace(/^\/+/, '')}`;
};

export const getResolvedImageUrl = (url, gender = 'Male') => {
  const isFemale = typeof gender === 'string' && ['female', 'bride', 'f'].includes(gender.toLowerCase());
  const fallback = isFemale ? DEFAULT_FEMALE : DEFAULT_MALE;
  if (!url || url === 'null' || url === 'undefined') return fallback;

  const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  if (typeof window !== 'undefined' && url.includes('localhost:5000') && !isLocal) {
    const filename = url.split('/uploads/')[1];
    if (filename) {
      return `${window.location.origin}/api/uploads/${filename}`;
    }
  }

  // Handle uploaded images
  if (url.startsWith('/uploads/') || url.startsWith('uploads/') || url.startsWith('/api/uploads/') || url.startsWith('api/uploads/')) {
    let cleanPath = url.startsWith('/') ? url : '/' + url;
    if (isLocal) {
      if (cleanPath.startsWith('/api/uploads/')) {
        return `http://localhost:5000${cleanPath.replace('/api', '')}`;
      }
      return `http://localhost:5000${cleanPath}`;
    }
    if (cleanPath.startsWith('/uploads/')) {
      return `/api${cleanPath}`;
    }
    return cleanPath;
  }

  return url;
};

export const handleImageError = (e, gender = 'Male') => {
  e.target.onerror = null;
  const isFemale = typeof gender === 'string' && ['female', 'bride', 'f'].includes(gender.toLowerCase());
  e.target.src = isFemale ? DEFAULT_FEMALE : DEFAULT_MALE;
};
