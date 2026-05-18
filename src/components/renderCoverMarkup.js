import { bookIcon, coverPlaceholderLabel } from "../assets/placeholders.js";
import { escapeAttribute } from "../utils/escape.js";
import { getCoverUrl } from "../utils/books.js";

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
