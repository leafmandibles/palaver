export function summarizePath(fullPath) {
  if (!fullPath) return '';
  const parts = fullPath.split('/').filter(Boolean);
  if (parts.length <= 2) return fullPath;
  return parts.slice(-2).join('/');
}

export function getPathInfo(fullPath, projectWorktree) {
  if (!fullPath) return null;
  
  const base = summarizePath(projectWorktree || fullPath);
  
  if (projectWorktree && fullPath.startsWith(projectWorktree) && fullPath !== projectWorktree) {
    const relativePath = fullPath.substring(projectWorktree.length).replace(/^\/+/, '');
    if (relativePath) {
      return { basePath: base, worktree: relativePath };
    }
  }

  return { basePath: summarizePath(fullPath), worktree: null };
}
