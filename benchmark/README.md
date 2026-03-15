# Framework Benchmark: VDOM vs. No-VDOM (Vapor/Solid/Svelte/React)

This project performs automated performance and resource consumption tests comparing modern frontend frameworks (Vue, Svelte, Solid, and React), with a special focus on the new Vue Vapor mode.

## Benchmark Methodology

### Test Scenario
*   **Data:** 10,000 Kanban cards distributed across 4 columns.
*   **Environment:** Playwright running on Headless Chromium with precise memory flags enabled.
*   **Hardware:** Tests are executed locally to ensure network and CPU consistency.

### Collected Metrics
1.  **Bundle Size (KB):** The actual size of the final production JavaScript file served to the browser.
2.  **Initial Load (ms):** Time from the start of navigation until 10,000 components are mounted and visible in the DOM.
3.  **Filtering Reactivity (ms):** System response time when typing in the filter. Measures the framework's ability to remove/re-insert thousands of nodes quickly.
4.  **Drag & Drop (ms):** Time taken to process the movement of an item between different column arrays. This is the most critical test as it reveals the cost of re-rendering and diffing.
5.  **Memory Heap (MB):** Actual RAM occupied by the application after initial rendering and Garbage Collector stabilization.

### How to Run
```sh
cd vapor/benchmark
pnpm install
node run-benchmarks.js
```

---

## Key Findings

| Metric | Vue 3.5 (VDOM) | Vue Vapor | SolidJS | Svelte 5 | React 19 (VDOM) |
|:--- |:---:|:---:|:---:|:---:|:---:|
| **Memory Efficiency** | Baseline | **-25%** | -20% | -10% | +10% |
| **D&D Performance** | Heavy Lag | **Instant** | **Instant** | **Instant** | Heavy Lag |

*   **Vapor Mode:** Removes the Virtual DOM overhead, reducing memory usage significantly while maintaining 100% Vue compatibility.
*   **Virtual DOM Bottleneck:** In high-density scenarios (10k+ nodes), the VDOM diffing process (standard in Vue 3.5 and React 19) becomes a multi-second bottleneck during structural changes.

---

## Fair Comparison

To ensure a fair and honest benchmark, we follow these rules:
1.  **No External Libs**: No virtualization libraries (like `react-window`) or optimized filtering libraries (like `Fuse.js`) were used.
2.  **Framework Core**: We use only the core APIs of each framework (e.g., React hooks, Vue refs, Svelte runes).
3.  **Identical Logic**: Data manipulation logic, search algorithms, and DOM structure are strictly identical across all projects.
4.  **Pure Tailwind**: Pure Tailwind CSS v4 styling is used in all cases without additional abstraction layers.

The goal is to measure the performance of the **framework core** when handling large data volumes and DOM manipulation, without "shortcuts" that could favor one framework over another.