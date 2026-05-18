import { sanitizeFavoriteBooks } from "../utils/books.js";

const FAVORITES_KEY = 'book-finder:favorites';

export function loadFavorites() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return sanitizeFavoriteBooks(parsed);
  } catch (error) {
    console.error(error);
    return [];
  }
}

export function saveFavorites(favorites) {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  } catch (error) {
    console.error(error);
  }
}
