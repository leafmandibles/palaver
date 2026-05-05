export function createThemeState() {
  // Check if we're in browser environment
  const isBrowser = typeof window !== 'undefined';
  
  // Try to get saved theme or default
  const getInitialTheme = () => {
    if (isBrowser) {
      const saved = localStorage.getItem('theme');
      if (saved) return saved;
      
      // Could check system preference here if wanted
    }
    return 'default';
  };

  let currentTheme = $state(getInitialTheme());

  function setTheme(themeName) {
    currentTheme = themeName;
    if (isBrowser) {
      localStorage.setItem('theme', themeName);
      document.documentElement.setAttribute('data-theme', themeName);
    }
  }

  // Initialize on creation if in browser
  if (isBrowser) {
    document.documentElement.setAttribute('data-theme', currentTheme);
  }

  return {
    get current() { return currentTheme; },
    setTheme
  };
}

export const themeState = createThemeState();
