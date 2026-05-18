export const ALL_AUTHORS_FILTER = "all";

export function normalizeBook(book) {
  if (!book?.key || !book?.title) {
    return null;
  }

  return {
    key: book.key,
    title: book.title,
    author_name: Array.isArray(book.author_name) ? book.author_name.slice(0, 3) : [],
    first_publish_year: book.first_publish_year || null,
    cover_i: book.cover_i || null,
  };
}

export function sanitizeFavoriteBooks(books) {
  if (!Array.isArray(books)) {
    return [];
  }

  const uniqueBooks = new Map();

  books.forEach((book) => {
    const normalizedBook = normalizeBook(book);
    if (!normalizedBook || uniqueBooks.has(normalizedBook.key)) {
      return;
    }

    uniqueBooks.set(normalizedBook.key, normalizedBook);
  });

  return [...uniqueBooks.values()];
}

export function getBookAuthors(book) {
  return book.author_name?.join(", ") || "Unknown author";
}

export function getBookYear(book) {
  return book.first_publish_year || "—";
}

export function getAvailableAuthors(books) {
  return [
    ...new Set(books.flatMap((book) => book.author_name).filter(Boolean)),
  ].sort((left, right) => left.localeCompare(right, "en"));
}

export function filterBooksByAuthor(books, selectedAuthor) {
  if (selectedAuthor === ALL_AUTHORS_FILTER) {
    return books;
  }

  return books.filter((book) => book.author_name.includes(selectedAuthor));
}

export function createFavoriteKeySet(favorites) {
  return new Set(favorites.map((book) => book.key));
}

export function getCoverUrl(coverId) {
  return `https://covers.openlibrary.org/b/id/${coverId}.jpg`;
}
