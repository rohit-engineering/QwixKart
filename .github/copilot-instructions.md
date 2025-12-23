<!-- .github/copilot-instructions.md - project-specific guidance for AI coding agents -->
# Copilot agent instructions — genz-shop

Purpose: give an AI coding agent the minimal, actionable facts to be productive in this Vue 3 + Vite codebase.

- **Big picture**: This is a Vue 3 Single-Page App scaffolded for Vite. UI is organized into `src/pages/` (route views) and `src/components/` (reusable pieces). Data and side effects are handled via composables in `src/composables/` (no Vuex). Key external services: Supabase for auth & DB and several UI libs (Bootstrap, ApexCharts, Toasts).

- **Where to start reading**:
  - App bootstrap: [src/main.js](src/main.js)
  - Routing & auth guards: [src/router/index.js](src/router/index.js)
  - Supabase integration: [src/composables/useSupabase.js](src/composables/useSupabase.js)
  - Dev/build configuration: [vite.config.js](vite.config.js)

- **Architecture & data flow (concise)**:
  - Pages lazily import views (see `src/router/index.js`) — keep lazy imports when changing routes.
  - Auth and DB access are encapsulated in `useSupabase()` and related composables. Prefer using these composables (or `useDatabase()` / `useAuth()`) rather than calling Supabase directly across components.
  - Real-time updates use `useRealtime(tableName, callback)` in `useSupabase.js` — it subscribes to Postgres changes via Supabase channels.
  - There is no centralized store; cross-component state is handled with composables + `@tanstack/vue-query` for server state caching.

- **Developer workflows / commands**:
  - Dev server: `npm run dev` (uses `vite`)
  - Build: `npm run build` (Vite build with compression + PWA configured)
  - Preview production build: `npm run preview`
  - Extra script: `npm run optimize` runs `optimize.js` (project-specific optimizations)

- **Important environment variables**:
  - `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` — required for Supabase client in `src/composables/useSupabase.js`.
  - HMR behavior can depend on `HOST` and `HTTPS` (see `vite.config.js`).

- **Build / deployment notes** (from `vite.config.js`):
  - Production builds enable gzip and brotli compression and drop console statements via terser.
  - The PWA plugin includes a runtime caching rule for Supabase (`/.*\.supabase\.co/`) — avoid removing it without understanding offline implications.
  - A rollup visualizer writes `dist/stats.html` when run; use it after `npm run build` to inspect bundle splits.

- **Patterns & conventions to preserve**:
  - Keep route components lazy-loaded (dynamic imports) to preserve initial bundle size.
  - Use composables in `src/composables/` for shared logic (examples: `useCart.js`, `useOrders.js`, `useProductReviews.js`).
  - Use `@tanstack/vue-query` for server-fetch caching where present — prefer it for paginated/fetch-heavy widgets.
  - Styling: main entry points are `styles/main.scss` and `src/assets/main.css`; tailwind config exists but project primarily uses Bootstrap.

- **Where to look for integrations / side effects**:
  - Supabase (auth, DB, realtime): [src/composables/useSupabase.js](src/composables/useSupabase.js)
  - PDF generation utilities: [utils/pdfmake.js](utils/pdfmake.js)
  - Toast configuration and global plugins: [src/main.js](src/main.js)

- **Small, concrete examples agents can use**:
  - To fetch profile after login: call `fetchProfile(id)` exported from `useAuth()` in `src/composables/useSupabase.js`.
  - To subscribe to real-time changes on `orders`: `useRealtime('orders', payload => { /* handle INSERT/UPDATE/DELETE */ })`.
  - To add a new DB row: use `insert(table, values)` from `useDatabase()`.

- **When changing build or server config**:
  - If editing `vite.config.js` keep `optimizeDeps.include` and HMR host settings in mind — changing these affects dev HMR reliability.
  - Preserve `manualChunks` logic if you modify dependencies to avoid large unexpected bundle changes.

- **Files worth reviewing before large changes**:
  - [vite.config.js](vite.config.js) — build, HMR, PWA, compression
  - [src/composables/useSupabase.js](src/composables/useSupabase.js) — central service API
  - [src/router/index.js](src/router/index.js) — auth-protected routes and lazy-loading
  - [src/main.js](src/main.js) — global plugin & toast defaults

If anything above is unclear or you want me to expand examples (e.g., show a code snippet of `useRealtime` usage in a component), tell me which area to expand. After your review I will update this file accordingly.
