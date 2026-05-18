const THEME_KEY = 'book-finder:theme';
const DEFAULT_THEME = 'sepia';
const ALLOWED_THEMES = ['sepia', 'ocean', 'midnight'];

export function loadTheme() {
  try {
    const savedTheme = localStorage.getItem(THEME_KEY);
    return ALLOWED_THEMES.includes(savedTheme) ? savedTheme : DEFAULT_THEME;
  } catch (error) {
    console.error(error);
    return DEFAULT_THEME;
  }
}

export function saveTheme(theme) {
  if (!ALLOWED_THEMES.includes(theme)) {
    return;
  }

  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (error) {
    console.error(error);
  }
}
