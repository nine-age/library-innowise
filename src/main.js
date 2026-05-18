import "./style.css";
import { searchBooksByTitle } from "./api/openLibrary.js";
import { renderApp } from "./components/renderApp.js";
import { loadFavorites, saveFavorites } from "./storage/favorites.js";
import { loadTheme, saveTheme } from "./storage/theme.js";
import { debounce } from "./utils/debounce.js";
import { ALL_AUTHORS_FILTER, filterBooksByAuthor } from "./utils/books.js";

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
  error: "",
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
  error: "",
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
    filteredResults: getFilteredResults(state.results, selectedAuthor),
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
  return (
    state.results.find((item) => item.key === bookKey)
    || state.favorites.find((item) => item.key === bookKey)
  );
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
    selectedAuthor: ALL_AUTHORS_FILTER,
  });

  try {
    const books = await searchBooksByTitle(query, {
      signal: searchAbortController.signal,
    });
    if (searchToken !== activeSearchToken) {
      return;
    }

    updateState({
      results: books,
      filteredResults: getFilteredResults(books, ALL_AUTHORS_FILTER),
      loading: false,
      error: books.length ? "" : "No books found.",
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
      error: "Network error.",
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
    draftQuery: clearDraft ? "" : state.draftQuery,
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
