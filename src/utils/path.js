export function summarizePath(fullPath) {
  if (!fullPath) return '';
  const parts = fullPath.split('/').filter(Boolean);
  if (parts.length <= 2) return fullPath;
  return parts.slice(-2).join('/');
}
