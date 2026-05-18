import { heartIcon } from "../assets/placeholders.js";
import { renderCoverMarkup } from "./renderCoverMarkup.js";
import { escapeAttribute, escapeHtml } from "../utils/escape.js";
import { getBookAuthors, getBookYear } from "../utils/books.js";

export function renderBookCard(book, favoriteKeys) {
  const isFavorite = favoriteKeys.has(book.key);
  const authors = getBookAuthors(book);
  const year = getBookYear(book);
  const coverMarkup = renderCoverMarkup({
    title: book.title,
    coverId: book.cover_i,
    frameClass: "book-card__cover-frame",
    imageClass: "book-card__cover",
    placeholderClass: "book-card__cover book-card__cover--placeholder",
    placeholderIconClass: "book-card__cover-icon",
    showPlaceholderLabel: true,
  });

  return `
    <article class="book-card">
      <div class="book-card__media">
        ${coverMarkup}
        <button
          class="book-card__favorite ${isFavorite ? "book-card__favorite--active" : ""}"
          type="button"
          data-favorite-toggle
          data-book-key="${escapeAttribute(book.key)}"
          aria-label="${isFavorite ? "Remove from favorites" : "Add to favorites"}: ${escapeAttribute(book.title)}"
        >
          <img class="book-card__favorite-icon" src="${heartIcon}" alt="" aria-hidden="true" />
        </button>
      </div>
      <div class="book-card__body">
        <h3>${escapeHtml(book.title)}</h3>
        <p class="book-card__authors">${escapeHtml(authors)}</p>
        <p class="book-card__year">${year}</p>
      </div>
    </article>
  `;
}
