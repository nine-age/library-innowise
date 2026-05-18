# Book Finder

## Task

- Task reference: [Open the assignment document](https://drive.google.com/file/d/1RBRcuH-_oAvtjem5Xs0c4NXZ8I38aYyH/view)
- The app is built with `HTML`, `CSS`, `JavaScript (ES6+)`, `Vite`, `Open Library API`, and `localStorage`.

## How to Run the App

```bash
npm install
npm run dev
```

## How to Build the App

```bash
npm run build
```

The production output is generated in the `dist/` folder.

## Project Structure

- `index.html` - application entry HTML file.
- `src/main.js` - main application logic, state updates, events, and rendering.
- `src/components/` - UI render functions for the app shell, book cards, and message states.
- `src/api/` - API requests to Open Library.
- `src/assets/` - SVG icons and shared placeholders.
- `src/storage/` - `localStorage` helpers for favorites and selected theme.
- `src/utils/` - utility helpers for debounce, escaping, and book normalization.
- `src/style.css` - global styles, layout, themes, and component styling.
- `vite.config.js` - Vite configuration for static build output.
- `dist/` - generated production build files.
