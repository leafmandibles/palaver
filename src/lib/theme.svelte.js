export function createThemeState() {
  // Check if we're in browser environment
  const isBrowser = typeof window !== 'undefined';

  const themeAliases = {
    default: 'default-green',
    'default-blue': 'blue'
  };

  function normalizeTheme(themeName) {
    return themeAliases[themeName] || themeName;
  }
  
  // Try to get saved theme or default
  const getInitialTheme = () => {
    if (isBrowser) {
      const saved = localStorage.getItem('theme');
      if (saved) return normalizeTheme(saved);
      
      // Could check system preference here if wanted
    }
    return 'default-green';
  };

  let currentTheme = $state(getInitialTheme());

  function setTheme(themeName) {
    currentTheme = normalizeTheme(themeName);
    if (isBrowser) {
      localStorage.setItem('theme', currentTheme);
      document.documentElement.setAttribute('data-theme', currentTheme);
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
