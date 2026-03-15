# Performance Comparison: Vue Vapor vs. Modern Frameworks

This repository provides a technical benchmark comparing performance, memory efficiency, and reactivity across modern frontend frameworks. The primary objective is to evaluate **Vue Vapor** (Vue 3.6+ non-VDOM mode) against standard Vue 3.5, Svelte 5, SolidJS, and React 19 in high-density data scenarios.

## Project Structure

The project consists of five identical Kanban applications built with 10,000 cards:

- `vue-vapor/`: Vue 3.6.0-beta.7 using direct DOM manipulation (No Virtual DOM).
- `vue-3.5/`: Vue 3.5.30 using the standard Virtual DOM.
- `svelte/`: Svelte 5 using Runes.
- `solidjs/`: SolidJS 1.9 using native Signals.
- `react/`: React 19 using standard Hooks and Virtual DOM.

### Common Technical Stack
- **pnpm Workspaces** (Package manager and orchestrator)
- **Vite 8.0** (Build tool)
- **Tailwind CSS v4** (Styling)

## Final Benchmark Results (10,000 Nodes)

Metrics captured via automated Playwright stress tests on a clean Chromium environment.

| Metric | Vue 3.5 | Vue Vapor | Svelte 5 | SolidJS | React 19 |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **JS Bundle (KB)** | 67.38 | 54.95 | 40.14 | 24.93 | 118.20 |
| **Initial Load (ms)** | 1433.78 | 1282.98 | 1420.66 | 1415.12 | 1580.45 |
| **Memory Heap (MB)** | 48.13 | 35.77 | 38.49 | 38.85 | 52.40 |
| **Filtering (ms)** | 219.84 | 221.74 | 210.31 | 191.56 | 235.12 |
| **Drag & Drop (ms)** | 5460.53 | 908.33 | 943.48 | 937.59 | 5820.10 |

## Fair Comparison Disclaimer

To ensure a fair and honest comparison between frameworks, this benchmark follows these guidelines:

1.  **No External Optimizations**: No third-party libraries were used for filtering (such as `Fuse.js` or `Lodash`), nor were complex third-party components used for the Kanban board.
2.  **"Raw" Framework**: Each implementation uses only the framework's native APIs (e.g., `useState/useMemo` in React, `Runes` in Svelte, `Signals` in Solid, `Refs/Computed` in Vue).
3.  **Identical Implementation**: Data manipulation logic, search algorithms, and DOM structure are strictly identical across all projects.
4.  **Native Tailwind**: Styling is done purely with Tailwind CSS v4 without additional abstraction layers.

The goal is to measure the performance of the **framework core** when handling large data volumes and DOM manipulation, without "shortcuts" that could favor one framework over another.

## Technical Analysis

### The Performance Trade-off
The benchmark reveals a fundamental architectural shift in Vue Vapor. While maintaining the familiar Vue Composition API, the execution performance in high-density scenarios is significantly superior.

1. **Virtual DOM Bottleneck**: In Vue 3.5, moving a single card in a 10,000-node list triggers a full VDOM tree reconciliation (diffing), resulting in a multi-second UI freeze (~5.4s).
2. **Vapor Direct Update**: Vue Vapor bypasses diffing entirely. It targets the specific DOM node for the update, completing the same operation in under 950ms.

### Memory Efficiency
Vue Vapor achieved the lowest memory footprint (35.77 MB) among all tested frameworks. By removing the need to store a parallel Virtual DOM tree in RAM, Vapor reduces memory pressure by ~25% compared to standard Vue 3.5.

### Summary
Vue Vapor proves to be the most efficient choice for high-density applications where CPU and Memory are prioritized. It delivers SolidJS-tier performance while maintaining the Vue developer experience.

## Methodology

This project uses **pnpm** as the primary package manager and runtime orchestrator for increased installation stability and efficient dependency hoisting.

### Execution

1. **Setup**: Install all dependencies across the workspace.
   ```sh
   pnpm run setup
   ```

2. **Benchmark**: Run the automated performance suite.
   ```sh
   pnpm run bench
   ```

Upon completion, a `BENCHMARK_REPORT.md` file is generated in the root directory with the latest captured metrics.

Detailed methodology can be found in the [Benchmark README](./benchmark/README.md).