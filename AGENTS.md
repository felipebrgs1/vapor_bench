# AGENTS.md — Framework Comparison Project

## Visão Geral

Este repositório é um benchmark comparativo de frameworks frontend, com 4 projetos idênticos em funcionalidade mas cada um usando um framework diferente. O objetivo é comparar performance, bundle size, DX e especialmente o novo modo Vue Vapor (sem Virtual DOM) introduzido no Vue 3.6.

---

## Estrutura do Repositório

```
vapor/
├── svelte/        ← Svelte 5 + Vite 8 + Tailwind v4
├── vue-3.5/       ← Vue 3.5.30 + Vite 8 + Tailwind v4
├── vue-vapor/     ← Vue 3.6.0-beta.7 (modo Vapor) + Vite 8 + Tailwind v4
└── solidjs/       ← SolidJS 1.9 + Vite 8 + Tailwind v4
```

Todos os projetos são intencionalmente idênticos em funcionalidade: um contador reativo centralizado na tela com estilo via Tailwind CSS.

---

## Stack Comum a Todos os Projetos

| Ferramenta      | Versão   | Observação                                              |
|-----------------|----------|---------------------------------------------------------|
| Vite            | `^8.0.0` | Build tool unificado                                    |
| Tailwind CSS    | `^4.2.1` | Via plugin `@tailwindcss/vite` — sem `tailwind.config.js` |
| pnpm            | `^10.x`  | Gerenciador de pacotes e Workspaces                     |
| Node.js         | `22.x`   | Ambiente de desenvolvimento                             |

---

## Detalhes por Projeto

### `svelte/` — Svelte 5

- **Framework:** `svelte ^5.0.0`
- **Plugin Vite:** `@sveltejs/vite-plugin-svelte ^7.0.0`
  - A versão `^5.x` suporta apenas Vite ≤ 6. Para Vite 8, usar obrigatoriamente `^7.0.0`.
- **Reatividade:** Runes do Svelte 5 (`$state`, não `writable` stores)
- **Entry point:** `src/main.js` → monta com `mount()` (API do Svelte 5, não `new App()`)
- **Cor do botão:** Laranja (`bg-orange-500`)

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
  let count = $state(0)
</script>
```

---

### `vue-3.5/` — Vue 3.5 (referência VDOM)

- **Framework:** `vue 3.5.30` (versão fixada, não range)
- **Plugin Vite:** `@vitejs/plugin-vue ^6.0.0`
  - A versão `^5.x` suporta apenas Vite ≤ 6. Para Vite 8, usar obrigatoriamente `^6.0.0`.
- **Reatividade:** `ref()` da Composition API padrão
- **Entry point:** `src/main.js` → `createApp(App).mount('#app')`
- **Cor do botão:** Verde (`bg-green-500`)
- **Papel:** Baseline de comparação com Virtual DOM clássico

---

### `vue-vapor/` — Vue 3.6 Vapor (sem Virtual DOM)

- **Framework:** `vue 3.6.0-beta.7` (versão fixada de beta)
- **Plugin Vite:** `@vitejs/plugin-vue ^6.0.3`
- **Modo Vapor:** Renderização sem Virtual DOM — manipulação direta do DOM
- **Entry point:** `src/main.js` → usa `createVaporApp` do pacote `@vue/runtime-vapor`
- **Cor do botão:** Azul (`bg-blue-500`)

#### Detalhes críticos do Vue Vapor

**1. Import correto de `createVaporApp`:**
```js
// CORRETO
import { createVaporApp } from '@vue/runtime-vapor'

// ERRADO — esse subpath não existe no pacote vue 3.6
import { createVaporApp } from 'vue/vapor'
```

**2. Flag `vapor` na tag `<script setup>`:**
Para ativar a compilação Vapor em um SFC, a tag `<script>` precisa do atributo `vapor`:
```vue
<!-- CORRETO — compila sem VDOM -->
<script vapor setup>
  import { ref } from 'vue'
  const count = ref(0)
</script>

<!-- ERRADO — compila normalmente com VDOM -->
<script setup>
  ...
</script>
```
O `@vue/compiler-sfc` detecta o atributo `vapor` no bloco e ativa o `@vue/compiler-vapor`.

**3. Instalação com pnpm:**
O `vue 3.6.0-beta.7` exige compatibilidade de peer dependencies. A instalação no monorepo pnpm utiliza flags automáticas no `.npmrc` ou:
```sh
pnpm install
```

**4. Resultado esperado:** O bundle JS do `vue-vapor` é ~25% menor que o `vue-3.5` por eliminar o overhead do VDOM.

---

### `solidjs/` — SolidJS

- **Framework:** `solid-js ^1.9.0`
- **Plugin Vite:** `vite-plugin-solid ^2.11.0`
- **Reatividade:** Signals nativos (`createSignal`) — sem VDOM, similar ao Vapor
- **Entry point:** `src/main.jsx` → `render(() => <App />, document.getElementById('app'))`
- **Cor do botão:** Roxo (`bg-purple-500`)
- **Nota:** Usar `class=` (not `className=`) em JSX do SolidJS

---

## Tailwind CSS v4 — Configuração

Todos os projetos usam Tailwind CSS v4 com a abordagem Vite-first:

Não existe `tailwind.config.js`, `postcss.config.js` ou diretivas `@tailwind base/components/utilities`.

### Padrão em todos os projetos:

**`vite.config.js`** — `tailwindcss()` deve ser o primeiro plugin:
```js
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss(), framework()], // tailwind ANTES do plugin do framework
})
```

**`src/style.css`** — único arquivo CSS necessário:
```css
@import "tailwindcss";
```

**`src/main.js`** — importar o CSS antes do componente raiz:
```js
import './style.css'
import App from './App'
```

---

## Comandos do Monorepo

Na raiz do projeto:

```sh
pnpm run setup   # instala dependências de todos os projetos
pnpm run bench   # executa a suite de benchmark automatizada
```

---

## Comparativo de Bundle Size (produção, gzip)

| Projeto      | JS      | CSS     | Total   |
|--------------|---------|---------|---------|
| `svelte`     | ~10.5 kB | ~2.3 kB | ~12.8 kB |
| `vue-3.5`    | ~23.6 kB | ~2.6 kB | ~26.2 kB |
| `vue-vapor`  | ~16.0 kB | ~2.5 kB | ~18.5 kB |
| `solidjs`    | ~5.2 kB  | ~2.3 kB | ~7.5 kB  |

> Valores medidos com o counter simples. Projetos maiores terão proporções diferentes.

---

## Notas para Agentes de IA

- Ao adicionar dependências, usar `pnpm add` na pasta do projeto ou `pnpm -filter <projeto> add <pkg>`.
- Ao adicionar dependências aos projetos Vue, sempre verificar se a versão do `@vitejs/plugin-vue` é `^6.x` (não `^5.x`) — obrigatório para Vite 8.
- O `vue-vapor` importa de `@vue/runtime-vapor`, não de `vue` diretamente — não alterar esse import.
- A flag `vapor` no `<script vapor setup>` do `vue-vapor/src/App.vue` é obrigatória — sem ela o componente compila com VDOM normal, anulando o propósito do projeto.
- O `tailwindcss()` deve sempre vir antes do plugin do framework no array `plugins` do Vite.
- Nenhum projeto usa `tailwind.config.js` — isso é intencional (Tailwind v4 auto-detecta os arquivos).