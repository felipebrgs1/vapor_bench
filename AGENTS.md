# AGENTS.md — Framework Comparison Project

## Overview

This repository is a comparative benchmark of frontend frameworks, featuring 5 projects identical in functionality, each using a different framework. The goal is to compare performance, bundle size, DX, and especially the new Vue Vapor mode (hybrid strategy: VDOM + Vapor compiled components) introduced in Vue 3.6.

---

## Repository Structure

```
vapor/
├── svelte/        ← Svelte 5 + Vite 8 + Tailwind v4
├── vue-3.5/       ← Vue 3.5.30 + Vite 8 + Tailwind v4
├── vue-vapor/     ← Vue 3.6.0-beta.8 (Hybrid mode: VDOM + Vapor) + Vite 8 + Tailwind v4
├── solidjs/       ← SolidJS 1.9 + Vite 8 + Tailwind v4
└── react/         ← React 19 + Vite 8 + Tailwind v4
```

All projects are intentionally identical in functionality: a reactive Kanban board with 10,000 cards styled via Tailwind CSS.

---

## Common Stack Across All Projects

| Tool            | Version  | Observation                                             |
|-----------------|----------|---------------------------------------------------------|
| Vite            | `^8.0.0` | Unified build tool                                      |
| Tailwind CSS    | `^4.2.1` | Via `@tailwindcss/vite` plugin — no `tailwind.config.js` |
| pnpm            | `^10.x`  | Package manager and Workspaces                          |
| Node.js         | `22.x`   | Development environment                                 |

---

## Project Details

### `svelte/` — Svelte 5

- **Framework:** `svelte ^5.0.0`
- **Vite Plugin:** `@sveltejs/vite-plugin-svelte ^7.0.0`
  - Version `^5.x` only supports Vite ≤ 6. For Vite 8, `^7.0.0` is mandatory.
- **Reactivity:** Svelte 5 Runes (`$state`, not `writable` stores)
- **Entry point:** `src/main.js` → mounts with `mount()` (Svelte 5 API, not `new App()`)
- **Button Color:** Orange (`bg-orange-500`)

```js
// src/main.js
import { mount } from 'svelte'
import './style.css'
import App from './App.svelte'

const app = mount(App, { target: document.getElementById('app') })
export default app
```

```svelte
<!-- src/App.svelte — Svelte 5 rune syntax -->
<script>
  let columns = $state(getInitialData())
</script>
```

---

### `vue-3.5/` — Vue 3.5 (VDOM Baseline)

- **Framework:** `vue 3.5.30` (fixed version, not range)
- **Vite Plugin:** `@vitejs/plugin-vue ^6.0.0`
  - Version `^5.x` only supports Vite ≤ 6. For Vite 8, `^6.0.0` is mandatory.
- **Reactivity:** `ref()` from standard Composition API
- **Entry point:** `src/main.js` → `createApp(App).mount('#app')`
- **Button Color:** Green (`bg-green-500`)
- **Role:** Baseline comparison with classic Virtual DOM

---

### `vue-vapor/` — Vue 3.6 Vapor (Hybrid Strategy: VDOM + Vapor Components)

- **Framework:** `vue 3.6.0-beta.8` (fixed beta version)
- **Vite Plugin:** `@vitejs/plugin-vue ^6.0.3`
- **Vapor Mode:** Hybrid — VDOM present, but components with `vapor` attribute compile to direct DOM instructions
- **Entry point:** `src/main.js` → uses `createApp` from `vue` (standard Vue app with VDOM)
- **Button Color:** Blue (`bg-blue-500`)

#### Critical Vue Vapor Details

**1. Correct App Creation (Hybrid Mode):**
```js
// CORRECT — hybrid mode (VDOM + Vapor components)
import { createApp, vaporInteropPlugin } from 'vue'

const app = createApp(App)
app.use(vaporInteropPlugin)
app.mount('#app')

// WRONG — pure vapor mode (no VDOM)
import { createVaporApp } from '@vue/runtime-vapor'
```

**2. `vapor` Flag in `<script setup>`:**
To activate Vapor compilation in an SFC, the `<script>` tag needs the `vapor` attribute:
```vue
<!-- CORRECT — vapor components (children) -->
<script vapor setup>
  import { ref } from 'vue'
  const count = ref(0)
</script>

<!-- CORRECT — App root uses normal VDOM (no vapor attribute) -->
<script setup>
  import { ref } from 'vue'
  const count = ref(0)
</script>
```
`@vue/compiler-sfc` detects the `vapor` attribute and activates `@vue/compiler-vapor`.
**Important:** The root App component must NOT have the `vapor` attribute — only child components that should compile to direct DOM instructions.

**3. Installation with pnpm:**
`vue 3.6.0-beta.8` requires peer dependency compatibility. Installation in the pnpm monorepo uses automatic flags in `.npmrc` or:
```sh
pnpm install
```

**4. Expected Result:** The `vue-vapor` JS bundle is ~25% smaller than `vue-3.5` by eliminating VDOM overhead in Vapor-compiled components.

---

### `solidjs/` — SolidJS

- **Framework:** `solid-js ^1.9.0`
- **Vite Plugin:** `vite-plugin-solid ^2.11.0`
- **Reactivity:** Native Signals (`createSignal`) — no VDOM, similar to Vapor
- **Entry point:** `src/main.jsx` → `render(() => <App />, document.getElementById('app'))`
- **Button Color:** Purple (`bg-purple-500`)
- **Note:** Use `class=` (not `className=`) in SolidJS JSX

---

### `react/` — React 19

- **Framework:** `react ^19.0.0`
- **Vite Plugin:** `@vitejs/plugin-react ^4.3.4`
- **Reactivity:** `useState` / `useMemo` / `useCallback` (Standard Hooks)
- **Entry point:** `src/main.jsx` → `createRoot(el).render(<App />)`
- **Button Color:** Sky Blue (`bg-sky-500`)
- **Role:** Comparison with traditional Virtual DOM (React 19)

---

## Tailwind CSS v4 — Configuration

All projects use Tailwind CSS v4 with the Vite-first approach:

There is no `tailwind.config.js`, `postcss.config.js`, or `@tailwind base/components/utilities` directives.

### Standard in all projects:

**`vite.config.js`** — `tailwindcss()` must be the first plugin:
```js
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss(), framework()], // tailwind BEFORE the framework plugin
})
```

**`src/style.css`** — the only required CSS file:
```css
@import "tailwindcss";
```

**`src/main.js`** — import CSS before the root component:
```js
import './style.css'
import App from './App'
```

---

## Monorepo Commands

In the project root:

```sh
pnpm run setup   # installs dependencies for all projects
pnpm run bench   # executes the automated benchmark suite
```

---

## Bundle Size Comparison (production, gzip)

| Project      | JS       | CSS     | Total    |
|--------------|----------|---------|----------|
| `svelte`     | ~10.5 kB | ~2.3 kB | ~12.8 kB |
| `vue-3.5`    | ~23.6 kB | ~2.6 kB | ~26.2 kB |
| `vue-vapor`  | ~99.0 kB | ~7.9 kB | ~106.9 kB |
| `solidjs`    | ~5.2 kB  | ~2.3 kB | ~7.5 kB |
| `react`      | ~45.0 kB | ~2.5 kB | ~47.5 kB |

> Values measured with the simple counter. Larger projects will have different proportions.
> Note: vue-vapor uses hybrid mode with both runtime-dom and runtime-vapor included (~98KB vendor + ~10KB app).

---

## Notes for AI Agents

- When adding dependencies, use `pnpm add` in the project folder or `pnpm -filter <project> add <pkg>`.
- When adding dependencies to Vue projects, always verify that the `@vitejs/plugin-vue` version is `^6.x` (not `^5.x`) — required for Vite 8.
- `vue-vapor` uses standard `createApp` from `vue` with `vaporInteropPlugin` for hybrid mode (VDOM + Vapor components).
- Child components (Board, Column, Card) use `<script vapor setup>` — the App root uses normal `<script setup>` (VDOM).
- `tailwindcss()` must always come before the framework plugin in the Vite `plugins` array.
- No project uses `tailwind.config.js` — this is intentional (Tailwind v4 auto-detects files).
