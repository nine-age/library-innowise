import { normalizeBook } from '../utils/books.js';

const SEARCH_ENDPOINT = 'https://openlibrary.org/search.json';

export async function searchBooksByTitle(query, options = {}) {
  const { signal } = options;
  const response = await fetch(
    `${SEARCH_ENDPOINT}?q=${encodeURIComponent(query)}&limit=12`,
    { signal },
  );

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();
  return (data.docs || []).map(normalizeBook).filter(Boolean);
}
