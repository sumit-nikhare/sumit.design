(() => {
  const toggles = document.querySelectorAll('[data-theme-toggle]');
  if (!toggles.length) return;

  const storageKey = 'theme';
  const root = document.documentElement;
  const media = window.matchMedia('(prefers-color-scheme: dark)');

  const getStoredTheme = () => {
    try {
      return localStorage.getItem(storageKey);
    } catch (err) {
      return null;
    }
  };

  const setStoredTheme = (theme) => {
    try {
      localStorage.setItem(storageKey, theme);
    } catch (err) {
      // Ignore storage errors (private mode, disabled storage, etc.).
    }
  };

  const resolveTheme = () => {
    const stored = getStoredTheme();
    if (stored === 'light' || stored === 'dark') return stored;
    return media.matches ? 'dark' : 'light';
  };

  const applyTheme = (theme) => {
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;

    toggles.forEach((toggle) => {
      toggle.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
      const label = toggle.querySelector('[data-theme-label]');
      if (label) label.textContent = theme === 'dark' ? 'Dark' : 'Light';
    });
  };

  applyTheme(resolveTheme());

  toggles.forEach((toggle) => {
    toggle.addEventListener('click', () => {
      const nextTheme = root.classList.contains('dark') ? 'light' : 'dark';
      applyTheme(nextTheme);
      setStoredTheme(nextTheme);
    });
  });

  media.addEventListener('change', () => {
    const stored = getStoredTheme();
    if (stored !== 'light' && stored !== 'dark') {
      applyTheme(media.matches ? 'dark' : 'light');
    }
  });
})();
