import { escapeHtml } from "../utils/escape.js";

export function renderMessageCard(message, modifier = "") {
  return `
    <article class="message-card ${modifier}">
      <p>${escapeHtml(message)}</p>
    </article>
  `;
}
