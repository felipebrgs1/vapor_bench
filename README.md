# Performance Comparison: Vue Vapor vs. Modern Frameworks

This repository provides a technical benchmark comparing the performance, memory efficiency, and reactivity of modern frontend frameworks. The primary focus is evaluating **Vue Vapor** (Vue 3.6+ non-VDOM mode) against standard Vue 3.5, Svelte 5, and SolidJS.

## Project Structure

The project consists of four identical Kanban applications built with different frameworks:

- `vue-vapor/`: Vue 3.6.0-beta.7 using direct DOM manipulation.
- `vue-3.5/`: Vue 3.5.30 using the standard Virtual DOM.
- `svelte/`: Svelte 5 using Runes.
- `solidjs/`: SolidJS 1.9 using native Signals.

All projects share a common technical stack:
- **Vite 8.0**
- **Tailwind CSS v4**
- **Bun Runtime**

## Benchmark Results (10,000 Nodes)

The following metrics were captured using a Playwright-based automated stress test. The test scenario involves rendering 10,000 cards and performing structural DOM updates via Drag & Drop.

| Metric | Vue 3.5 (VDOM) | Vue Vapor | Svelte 5 | SolidJS |
| :--- | :---: | :---: | :---: | :---: |
| **JS Bundle (KB)** | 67.38 | 54.95 | 40.14 | 24.93 |
| **Initial Load (ms)** | 1348.01 | 1257.84 | 1431.72 | 1363.24 |
| **Memory Heap (MB)** | 48.12 | 35.76 | 43.08 | 38.85 |
| **Filtering (ms)** | 243.46 | 212.44 | 256.33 | 209.91 |
| **Drag & Drop (ms)** | 5704.08 | 909.72 | 860.09 | 917.37 |

## Technical Analysis

### The Virtual DOM Bottleneck
The benchmark highlights a significant performance gap during structural updates. In the Drag & Drop test, **Vue 3.5 (VDOM)** required over 5.7 seconds to process a single movement. This is due to the reconciliation process (diffing) across 10,000 virtual nodes. 

### Vue Vapor Efficiency
**Vue Vapor** eliminated this bottleneck by bypassing the Virtual DOM. It achieved a **6x performance increase** in Drag & Drop and consumed **25% less memory** compared to Vue 3.5. These results place Vue Vapor in the same performance tier as SolidJS and Svelte 5 while maintaining full compatibility with the Vue Composition API.

### Memory Footprint
Vue Vapor demonstrated the lowest memory consumption among all tested frameworks (35.76 MB). By removing the overhead of maintaining a Virtual DOM tree in memory, the application remains lightweight even under heavy data loads.

## Methodology

This project uses **Bun** as the primary runtime and package manager for increased installation and execution speed.

### Execution

1. **Setup**: Install all dependencies for every framework and the benchmark tool.
   ```sh
   bun run setup
   ```

2. **Benchmark**: Run the automated performance suite.
   ```sh
   bun run bench
   ```

Upon completion, the script automatically generates a `BENCHMARK_REPORT.md` file in the root directory containing the latest captured metrics.

Detailed methodology can be found in the [Benchmark README](./benchmark/README.md).