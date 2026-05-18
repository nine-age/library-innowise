import { renderBookCard } from "./renderBookCard.js";
import { renderCoverMarkup } from "./renderCoverMarkup.js";
import { renderMessageCard } from "./renderMessageCard.js";
import { escapeAttribute, escapeHtml } from "../utils/escape.js";
import bookIcon from "../assets/book.svg";
import heartIcon from "../assets/heart.svg";
import searchIcon from "../assets/search.svg";
import {
  ALL_AUTHORS_FILTER,
  createFavoriteKeySet,
  getAvailableAuthors,
  getBookAuthors,
  getBookYear,
} from "../utils/books.js";

export function renderApp(state) {
  const favoriteKeys = createFavoriteKeySet(state.favorites);
  const shouldShowAuthorFilter = Boolean(
    state.query && !state.loading && !state.error && state.results.length,
  );
  const favoritesPanelClass = state.favorites.length
    ? "favorites-panel"
    : "favorites-panel favorites-panel--empty";
  const favoritesListClass = state.favorites.length
    ? "favorites-list"
    : "favorites-list favorites-list--empty";

  return `
    <div class="page-shell">
      <header class="topbar">
        <div class="brand">
          <span class="brand__mark">
            <img class="brand__icon" src="${bookIcon}" alt="" aria-hidden="true" />
          </span>
          <div class="brand__copy">
            <strong class="brand__title">The Library</strong>
            <span class="brand__subtitle">Discover your next favorite book</span>
          </div>
        </div>
        <div class="topbar__controls">
          <div class="theme-switcher" role="group" aria-label="Theme switcher">
            ${renderThemeButton("sepia", "Sepia", state.theme)}
            ${renderThemeButton("ocean", "Ocean", state.theme)}
            ${renderThemeButton("midnight", "Midnight", state.theme)}
          </div>
        </div>
      </header>

      <main class="page">
        <section class="hero">
          <div class="hero__content">
            <h1 class="hero__title">Discover Your Next Great Read</h1>
            <p class="hero__text">
              Search millions of books, build your personal library, and never lose track of what to read next.
            </p>
            <div class="hero__toolbar ${shouldShowAuthorFilter ? "" : "hero__toolbar--search-only"}">
              ${renderSearchForm(state, searchIcon)}
              ${shouldShowAuthorFilter
                ? `
                  <label class="toolbar__group">
                    <span class="toolbar__label">Filter by author</span>
                    <select class="toolbar__select" data-author-filter>
                      ${renderAuthorOptions(state)}
                    </select>
                  </label>
                `
                : ""}
            </div>
          </div>
        </section>

        <section class="catalogue">
          <div class="catalogue__grid">
            <div class="books-grid" data-results>
              ${renderResults(state, favoriteKeys)}
            </div>
          </div>

          <aside class="${favoritesPanelClass}">
            <div class="favorites-panel__head">
              <div class="favorites-panel__title-row">
                <img class="favorites-panel__icon" src="${heartIcon}" alt="" aria-hidden="true" />
                <h2>Favorites</h2>
              </div>
              <p>${renderSavedBooksLabel(state.favorites.length)}</p>
            </div>
            <div class="${favoritesListClass}" data-favorites>
              ${renderFavorites(state)}
            </div>
          </aside>
        </section>
      </main>

      <footer class="page-footer">
        Powered by <span>Open Library</span>
      </footer>
    </div>
  `;
}

function renderResults(state, favoriteKeys) {
  if (state.loading) {
    return renderMessageCard("Loading...");
  }

  if (state.error) {
    return renderMessageCard(state.error, "message-card--error");
  }

  if (!state.query) {
    return renderMessageCard("Enter a search query.");
  }

  if (!state.results.length) {
    return renderMessageCard("No books found.");
  }

  if (!state.filteredResults.length) {
    return renderMessageCard("No books found for the selected author.");
  }

  return state.filteredResults
    .map((book) => renderBookCard(book, favoriteKeys))
    .join("");
}

function renderFavorites(state) {
  if (!state.favorites.length) {
    return renderMessageCard(
      "No favorites yet. Save books to build your library.",
    );
  }

  return state.favorites.map((book) => renderFavoriteItem(book)).join("");
}

function renderFavoriteItem(book) {
  const authors = getBookAuthors(book);
  const year = getBookYear(book);
  const coverMarkup = renderCoverMarkup({
    title: book.title,
    coverId: book.cover_i,
    frameClass: "favorite-item__cover-frame",
    imageClass: "favorite-item__cover",
    placeholderClass: "favorite-item__cover favorite-item__cover--placeholder",
    placeholderIconClass: "favorite-item__cover-icon",
  });

  return `
    <article class="favorite-item">
      ${coverMarkup}
      <div class="favorite-item__body">
        <h3>${escapeHtml(book.title)}</h3>
        <p>${escapeHtml(authors)}</p>
        <span>${year}</span>
      </div>
      <button
        class="favorite-item__action"
        type="button"
        data-favorite-toggle
        data-book-key="${escapeAttribute(book.key)}"
        aria-label="Remove ${escapeAttribute(book.title)} from favorites"
      >
        <img src="${heartIcon}" alt="" aria-hidden="true" />
      </button>
    </article>
  `;
}

function renderAuthorOptions(state) {
  const authors = getAvailableAuthors(state.results);
  const options = authors
    .map(
      (author) => `
        <option value="${escapeAttribute(author)}" ${author === state.selectedAuthor ? "selected" : ""}>
          ${escapeHtml(author)}
        </option>
      `,
    )
    .join("");

  return `
    <option value="${ALL_AUTHORS_FILTER}" ${state.selectedAuthor === ALL_AUTHORS_FILTER ? "selected" : ""}>All authors</option>
    ${options}
  `;
}

function renderSearchForm(state, icon) {
  return `
    <form class="search" data-search-form>
      <label class="visually-hidden" for="book-query">Search books</label>
      <div class="search__row">
        <div class="search__field">
          <span class="search__icon-shell" aria-hidden="true">
            <img class="search__icon" src="${icon}" alt="" />
          </span>
          <input
            id="book-query"
            class="search__input"
            type="search"
            name="query"
            placeholder="Search for books by title or author..."
            autocomplete="off"
            value="${escapeAttribute(state.draftQuery)}"
            data-search-input
          />
        </div>
        <button class="search__button" type="submit">Search</button>
      </div>
    </form>
  `;
}

function renderThemeButton(themeValue, label, activeTheme) {
  return `
    <button
      class="theme-switcher__button ${themeValue === activeTheme ? "theme-switcher__button--active" : ""}"
      type="button"
      data-theme-value="${themeValue}"
    >
      ${label}
    </button>
  `;
}

function renderSavedBooksLabel(count) {
  return `${count} ${count === 1 ? "book" : "books"} saved`;
}
