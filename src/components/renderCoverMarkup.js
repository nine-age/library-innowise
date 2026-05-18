import bookIcon from "../assets/book.svg";
import { escapeAttribute } from "../utils/escape.js";
import { getCoverUrl } from "../utils/books.js";

const COVER_PLACEHOLDER_LABEL = "No cover";

export function renderCoverMarkup({
  title,
  coverId,
  frameClass,
  imageClass,
  placeholderClass,
  placeholderIconClass,
  showPlaceholderLabel = false,
}) {
  if (!coverId) {
    return `
      <div class="${placeholderClass}" aria-label="${COVER_PLACEHOLDER_LABEL}">
        <img class="${placeholderIconClass}" src="${bookIcon}" alt="" aria-hidden="true" />
        ${showPlaceholderLabel ? `<span>${COVER_PLACEHOLDER_LABEL}</span>` : ""}
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
