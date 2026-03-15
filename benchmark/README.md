# Framework Benchmark: VDOM vs. No-VDOM (Vapor/Solid/Svelte)

[Português](#metodologia-de-benchmark-pt) | [English](#benchmark-methodology-en)

---

## Metodologia de Benchmark (PT)

Este projeto realiza testes automatizados de performance e consumo de recursos comparando frameworks modernos com foco no novo modo Vue Vapor.

### Cenário de Teste
*   **Dados:** 10.000 cartões de Kanban distribuídos em 4 colunas.
*   **Ambiente:** Playwright rodando em Chromium Headless com flags de precisão de memória ativadas.
*   **Hardware:** Os testes são executados localmente para garantir consistência de rede e CPU.

### Métricas Coletadas
1.  **Bundle Size (KB):** Tamanho real do arquivo JavaScript final (produção) servido ao navegador.
2.  **Initial Load (ms):** Tempo desde o início da navegação até que 10.000 componentes sejam montados e visíveis no DOM.
3.  **Filtering Reactivity (ms):** Tempo de resposta do sistema ao digitar no filtro. Mede a capacidade do framework de remover/re-inserir milhares de nós rapidamente.
4.  **Drag & Drop (ms):** Tempo levado para processar a mudança de um item entre arrays de colunas diferentes. Este é o teste mais crítico, pois revela o custo de re-rendering e diffing.
5.  **Memory Heap (MB):** Memória RAM real ocupada pela aplicação após a renderização inicial e estabilização do Garbage Collector.

### Como Executar
```sh
cd vapor/benchmark
npm install
node run-benchmarks.js
```

---

## Benchmark Methodology (EN)

This project performs automated performance and resource consumption tests comparing modern frameworks, focusing on the new Vue Vapor mode.

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
npm install
node run-benchmarks.js
```

---

## Key Findings / Principais Descobertas

| Metric | Vue 3.5 (VDOM) | Vue Vapor | SolidJS | Svelte 5 |
|:--- |:---:|:---:|:---:|:---:|
| **Memory Efficiency** | Baseline | **-25%** | -20% | -10% |
| **D&D Performance** | Heavy Lag | **Instant** | **Instant** | **Instant** |

*   **Vapor Mode:** Removes the Virtual DOM overhead, reducing memory usage significantly while maintaining 100% Vue compatibility.
*   **Virtual DOM Bottleneck:** In high-density scenarios (10k+ nodes), the VDOM diffing process becomes a multi-second bottleneck during structural changes.