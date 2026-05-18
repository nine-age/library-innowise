(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) return;
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) processPreload(link);
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") continue;
      for (const node of mutation.addedNodes) if (node.tagName === "LINK" && node.rel === "modulepreload") processPreload(node);
    }
  }).observe(document, {
    childList: true,
    subtree: true
  });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials") fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep) return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
})();
const ALL_AUTHORS_FILTER = "all";
function normalizeBook(book) {
  if (!book?.key || !book?.title) {
    return null;
  }
  return {
    key: book.key,
    title: book.title,
    author_name: Array.isArray(book.author_name) ? book.author_name.slice(0, 3) : [],
    first_publish_year: book.first_publish_year || null,
    cover_i: book.cover_i || null
  };
}
function sanitizeFavoriteBooks(books) {
  if (!Array.isArray(books)) {
    return [];
  }
  const uniqueBooks = /* @__PURE__ */ new Map();
  books.forEach((book) => {
    const normalizedBook = normalizeBook(book);
    if (!normalizedBook || uniqueBooks.has(normalizedBook.key)) {
      return;
    }
    uniqueBooks.set(normalizedBook.key, normalizedBook);
  });
  return [...uniqueBooks.values()];
}
function getBookAuthors(book) {
  return book.author_name?.join(", ") || "Unknown author";
}
function getBookYear(book) {
  return book.first_publish_year || "—";
}
function getAvailableAuthors(books) {
  return [
    ...new Set(books.flatMap((book) => book.author_name).filter(Boolean))
  ].sort((left, right) => left.localeCompare(right, "en"));
}
function filterBooksByAuthor(books, selectedAuthor) {
  if (selectedAuthor === ALL_AUTHORS_FILTER) {
    return books;
  }
  return books.filter((book) => book.author_name.includes(selectedAuthor));
}
function createFavoriteKeySet(favorites) {
  return new Set(favorites.map((book) => book.key));
}
function getCoverUrl(coverId) {
  return `https://covers.openlibrary.org/b/id/${coverId}.jpg`;
}
const SEARCH_ENDPOINT = "https://openlibrary.org/search.json";
async function searchBooksByTitle(query, options = {}) {
  const { signal } = options;
  const response = await fetch(
    `${SEARCH_ENDPOINT}?q=${encodeURIComponent(query)}&limit=12`,
    { signal }
  );
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const data = await response.json();
  return (data.docs || []).map(normalizeBook).filter(Boolean);
}
const bookIcon = "" + new URL("assets/book.svg", import.meta.url).href;
const heartIcon = "" + new URL("assets/heart.svg", import.meta.url).href;
const searchIcon = "" + new URL("assets/search.svg", import.meta.url).href;
const coverPlaceholderLabel = "No cover";
function escapeHtml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}
function escapeAttribute(value) {
  return escapeHtml(value);
}
function renderCoverMarkup({
  title,
  coverId,
  frameClass,
  imageClass,
  placeholderClass,
  placeholderIconClass,
  showPlaceholderLabel = false
}) {
  if (!coverId) {
    return `
      <div class="${placeholderClass}" aria-label="${coverPlaceholderLabel}">
        <img class="${placeholderIconClass}" src="${bookIcon}" alt="" aria-hidden="true" />
        ${showPlaceholderLabel ? `<span>${coverPlaceholderLabel}</span>` : ""}
      </div>
    `;
  }
  return `
    <div class="${frameClass} cover-frame" data-cover-frame>
      <span class="cover-frame__loader" aria-hidden="true"></span>
      <img
        class="${imageClass} cover-frame__image"
        src="${getCoverUrl(coverId)}"
        alt="${escapeAttribute(title)} cover"
        loading="lazy"
        decoding="async"
        data-cover-image
      />
    </div>
  `;
}
function renderBookCard(book, favoriteKeys) {
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
    showPlaceholderLabel: true
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
function renderMessageCard(message, modifier = "") {
  return `
    <article class="message-card ${modifier}">
      <p>${escapeHtml(message)}</p>
    </article>
  `;
}
function renderApp(state2) {
  const favoriteKeys = createFavoriteKeySet(state2.favorites);
  const favoritesPanelClass = state2.favorites.length ? "favorites-panel" : "favorites-panel favorites-panel--empty";
  const favoritesListClass = state2.favorites.length ? "favorites-list" : "favorites-list favorites-list--empty";
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
            ${renderThemeButton("sepia", "Sepia", state2.theme)}
            ${renderThemeButton("ocean", "Ocean", state2.theme)}
            ${renderThemeButton("midnight", "Midnight", state2.theme)}
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
            <form class="search" data-search-form>
              <label class="visually-hidden" for="book-query">Search books</label>
              <div class="search__row">
                <div class="search__field">
                  <span class="search__icon-shell" aria-hidden="true">
                    <img class="search__icon" src="${searchIcon}" alt="" />
                  </span>
                  <input
                    id="book-query"
                    class="search__input"
                    type="search"
                    name="query"
                    placeholder="Search for books by title or author..."
                    autocomplete="off"
                    value="${escapeAttribute(state2.draftQuery)}"
                    data-search-input
                  />
                </div>
                <button class="search__button" type="submit">Search</button>
              </div>
            </form>
            <div class="hero__toolbar">
              <label class="toolbar__group">
                <span class="toolbar__label">Filter by author</span>
                <select class="toolbar__select" data-author-filter>
                  ${renderAuthorOptions(state2)}
                </select>
              </label>
            </div>
          </div>
        </section>

        <section class="catalogue">
          <div class="catalogue__grid">
            <div class="books-grid" data-results>
              ${renderResults(state2, favoriteKeys)}
            </div>
          </div>

          <aside class="${favoritesPanelClass}">
            <div class="favorites-panel__head">
              <div class="favorites-panel__title-row">
                <img class="favorites-panel__icon" src="${heartIcon}" alt="" aria-hidden="true" />
                <h2>Favorites</h2>
              </div>
              <p>${renderSavedBooksLabel(state2.favorites.length)}</p>
            </div>
            <div class="${favoritesListClass}" data-favorites>
              ${renderFavorites(state2)}
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
function renderResults(state2, favoriteKeys) {
  if (state2.loading) {
    return renderMessageCard("Loading...");
  }
  if (state2.error) {
    return renderMessageCard(state2.error, "message-card--error");
  }
  if (!state2.query) {
    return renderMessageCard("Enter a search query.");
  }
  if (!state2.results.length) {
    return renderMessageCard("No books found.");
  }
  if (!state2.filteredResults.length) {
    return renderMessageCard("No books found for the selected author.");
  }
  return state2.filteredResults.map((book) => renderBookCard(book, favoriteKeys)).join("");
}
function renderFavorites(state2) {
  if (!state2.favorites.length) {
    return renderMessageCard(
      "No favorites yet. Save books to build your library."
    );
  }
  return state2.favorites.map((book) => renderFavoriteItem(book)).join("");
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
    placeholderIconClass: "favorite-item__cover-icon"
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
function renderAuthorOptions(state2) {
  const authors = getAvailableAuthors(state2.results);
  const options = authors.map(
    (author) => `
        <option value="${escapeAttribute(author)}" ${author === state2.selectedAuthor ? "selected" : ""}>
          ${escapeHtml(author)}
        </option>
      `
  ).join("");
  return `
    <option value="${ALL_AUTHORS_FILTER}" ${state2.selectedAuthor === ALL_AUTHORS_FILTER ? "selected" : ""}>All authors</option>
    ${options}
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
const FAVORITES_KEY = "book-finder:favorites";
function loadFavorites() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return sanitizeFavoriteBooks(parsed);
  } catch (error) {
    console.error(error);
    return [];
  }
}
function saveFavorites(favorites) {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  } catch (error) {
    console.error(error);
  }
}
const THEME_KEY = "book-finder:theme";
const DEFAULT_THEME = "sepia";
const ALLOWED_THEMES = ["sepia", "ocean", "midnight"];
function loadTheme() {
  try {
    const savedTheme = localStorage.getItem(THEME_KEY);
    return ALLOWED_THEMES.includes(savedTheme) ? savedTheme : DEFAULT_THEME;
  } catch (error) {
    console.error(error);
    return DEFAULT_THEME;
  }
}
function saveTheme(theme) {
  if (!ALLOWED_THEMES.includes(theme)) {
    return;
  }
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (error) {
    console.error(error);
  }
}
function debounce(callback, delay) {
  let timeoutId = null;
  const debounced = (...args) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => {
      timeoutId = null;
      callback(...args);
    }, delay);
  };
  debounced.cancel = () => {
    window.clearTimeout(timeoutId);
    timeoutId = null;
  };
  return debounced;
}
const app = document.querySelector("#app");
if (!app) {
  throw new Error('App root "#app" was not found.');
}
const SEARCH_DEBOUNCE_MS = 800;
const SEARCH_IDLE_STATE = {
  query: "",
  results: [],
  filteredResults: [],
  selectedAuthor: ALL_AUTHORS_FILTER,
  loading: false,
  error: ""
};
let activeSearchToken = 0;
let searchAbortController = null;
const state = {
  favorites: loadFavorites(),
  results: [],
  filteredResults: [],
  query: "",
  draftQuery: "",
  selectedAuthor: ALL_AUTHORS_FILTER,
  theme: loadTheme(),
  loading: false,
  error: ""
};
const debouncedSearch = debounce(runSearch, SEARCH_DEBOUNCE_MS);
initializeApp();
function initializeApp() {
  applyTheme(state.theme);
  render();
  bindEvents();
}
function bindEvents() {
  app.addEventListener("click", handleAppClick);
  app.addEventListener("input", handleAppInput);
  app.addEventListener("change", handleAppChange);
  app.addEventListener("submit", handleAppSubmit);
}
function handleAppClick(event) {
  if (handleThemeChange(event)) {
    return;
  }
  handleFavoriteToggle(event);
}
function handleThemeChange(event) {
  const themeButton = event.target.closest("[data-theme-value]");
  if (!themeButton) {
    return false;
  }
  const nextTheme = themeButton.dataset.themeValue;
  if (!nextTheme || nextTheme === state.theme) {
    return true;
  }
  saveTheme(nextTheme);
  applyTheme(nextTheme);
  updateState({ theme: nextTheme });
  return true;
}
function handleAppInput(event) {
  const searchInput = event.target.closest("[data-search-input]");
  if (!searchInput) {
    return;
  }
  const draftQuery = searchInput.value;
  const query = draftQuery.trim();
  setDraftQuery(draftQuery);
  if (!query) {
    resetSearchState();
    return;
  }
  debouncedSearch(query);
}
function handleAppSubmit(event) {
  const searchForm = event.target.closest("[data-search-form]");
  if (!searchForm) {
    return;
  }
  event.preventDefault();
  debouncedSearch.cancel();
  const searchInput = searchForm.querySelector("[data-search-input]");
  const query = searchInput?.value.trim() || "";
  if (!query) {
    resetSearchState({ clearDraft: true });
    return;
  }
  updateState({ draftQuery: query });
  runSearch(query);
}
function handleAppChange(event) {
  const authorSelect = event.target.closest("[data-author-filter]");
  if (!authorSelect) {
    return;
  }
  const selectedAuthor = authorSelect.value;
  updateState({
    selectedAuthor,
    filteredResults: getFilteredResults(state.results, selectedAuthor)
  });
}
function handleFavoriteToggle(event) {
  const button = event.target.closest("[data-favorite-toggle]");
  if (!button) {
    return;
  }
  const bookKey = button.dataset.bookKey;
  const book = findBookByKey(bookKey);
  if (!book) {
    return;
  }
  const favorites = toggleFavoriteBook(book);
  saveFavorites(favorites);
  updateState({ favorites });
}
function toggleFavoriteBook(book) {
  const isFavorite = state.favorites.some((item) => item.key === book.key);
  if (isFavorite) {
    return state.favorites.filter((item) => item.key !== book.key);
  }
  return [book, ...state.favorites];
}
function findBookByKey(bookKey) {
  return state.results.find((item) => item.key === bookKey) || state.favorites.find((item) => item.key === bookKey);
}
async function runSearch(query) {
  const searchToken = ++activeSearchToken;
  cancelActiveSearch();
  searchAbortController = new AbortController();
  updateState({
    query,
    draftQuery: query,
    loading: true,
    error: "",
    results: [],
    filteredResults: [],
    selectedAuthor: ALL_AUTHORS_FILTER
  });
  try {
    const books = await searchBooksByTitle(query, {
      signal: searchAbortController.signal
    });
    if (searchToken !== activeSearchToken) {
      return;
    }
    updateState({
      results: books,
      filteredResults: getFilteredResults(books, ALL_AUTHORS_FILTER),
      loading: false,
      error: books.length ? "" : "No books found."
    });
  } catch (error) {
    if (error.name === "AbortError") {
      return;
    }
    if (searchToken !== activeSearchToken) {
      return;
    }
    updateState({
      loading: false,
      error: "Network error."
    });
    console.error(error);
  } finally {
    if (searchAbortController?.signal.aborted || searchToken !== activeSearchToken) {
      return;
    }
    searchAbortController = null;
  }
}
function resetSearchState(options = {}) {
  const { clearDraft = false } = options;
  debouncedSearch.cancel();
  activeSearchToken += 1;
  cancelActiveSearch();
  updateState({
    ...SEARCH_IDLE_STATE,
    draftQuery: clearDraft ? "" : state.draftQuery
  });
}
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
}
function setDraftQuery(draftQuery) {
  state.draftQuery = draftQuery;
}
function getFilteredResults(books, selectedAuthor) {
  return filterBooksByAuthor(books, selectedAuthor);
}
function cancelActiveSearch() {
  searchAbortController?.abort();
  searchAbortController = null;
}
function updateState(patch) {
  Object.assign(state, patch);
  render();
}
function render() {
  app.innerHTML = renderApp(state);
  enhanceCoverLoading();
}
function enhanceCoverLoading() {
  const coverImages = app.querySelectorAll("[data-cover-image]");
  coverImages.forEach((image) => {
    const frame = image.closest("[data-cover-frame]");
    if (!frame) {
      return;
    }
    if (image.complete && image.naturalWidth > 0) {
      markCoverLoaded(frame);
      return;
    }
    if (image.complete) {
      markCoverError(frame);
      return;
    }
    image.addEventListener("load", () => markCoverLoaded(frame), { once: true });
    image.addEventListener("error", () => markCoverError(frame), { once: true });
  });
}
function markCoverLoaded(frame) {
  frame.classList.add("cover-frame--loaded");
  frame.classList.remove("cover-frame--error");
}
function markCoverError(frame) {
  frame.classList.add("cover-frame--error");
  frame.classList.remove("cover-frame--loaded");
}
