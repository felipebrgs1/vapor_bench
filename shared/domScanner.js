/**
 * Benchmark DOM Scanner
 * Generic utility to measure Initial Render and DOM complexity across frameworks.
 * Optimized to avoid infinite loops and includes copy-to-clipboard functionality.
 */

(function () {
  const statsStyles = `
    position: fixed;
    bottom: 10px;
    right: 10px;
    background: rgba(0, 0, 0, 0.9);
    color: #00ff00;
    padding: 12px;
    border-radius: 8px;
    font-family: 'SF Mono', Monaco, Consolas, monospace;
    font-size: 11px;
    line-height: 1.4;
    z-index: 9999;
    box-shadow: 0 4px 15px rgba(0,0,0,0.5);
    border: 1px solid #333;
    min-width: 200px;
  `;

  const buttonStyles = `
    margin-top: 10px;
    width: 100%;
    background: #00ff00;
    color: #000;
    border: none;
    padding: 6px;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
    font-size: 10px;
    text-transform: uppercase;
    transition: opacity 0.2s;
    pointer-events: auto;
  `;

  let isUpdating = false;
  let lastStats = "";

  // Capture the start time as early as possible
  const scannerStartTime = performance.now();

  function createStatsPanel() {
    const container = document.createElement("div");
    container.id = "benchmark-stats";
    container.style.cssText = statsStyles;

    const content = document.createElement("div");
    content.id = "benchmark-content";
    container.appendChild(content);

    const copyBtn = document.createElement("button");
    copyBtn.innerText = "Copy";
    copyBtn.style.cssText = buttonStyles;
    copyBtn.onmouseenter = () => (copyBtn.style.opacity = "0.8");
    copyBtn.onmouseleave = () => (copyBtn.style.opacity = "1");

    copyBtn.onclick = (e) => {
      e.stopPropagation();
      const textToCopy = lastStats.replace(/<[^>]*>/g, "").trim();
      navigator.clipboard.writeText(textToCopy).then(() => {
        const originalText = copyBtn.innerText;
        copyBtn.innerText = "copied!";
        copyBtn.style.background = "#fff";
        setTimeout(() => {
          copyBtn.innerText = originalText;
          copyBtn.style.background = "#00ff00";
        }, 1500);
      });
    };

    container.appendChild(copyBtn);
    document.body.appendChild(container);
    return content;
  }

  function getDOMStats() {
    const nodes = document.querySelectorAll("*");
    const cards = document.querySelectorAll(".card");
    const columns = document.querySelectorAll(".column");

    let maxDepth = 0;
    const findDepth = (node, depth) => {
      maxDepth = Math.max(maxDepth, depth);
      for (let i = 0; i < node.children.length; i++) {
        findDepth(node.children[i], depth + 1);
      }
    };
    findDepth(document.body, 0);

    // Try to get memory via modern performance API first, then legacy
    let memoryUsed = "N/A";
    if (window.performance && window.performance.memory) {
      memoryUsed =
        Math.round(window.performance.memory.usedJSHeapSize / 1024 / 1024) +
        "MB";
    }

    return {
      totalNodes: nodes.length,
      cardCount: cards.length,
      columnCount: columns.length,
      maxDepth: maxDepth,
      memory: memoryUsed,
    };
  }

  function updateStats(contentElement) {
    if (isUpdating) return;
    isUpdating = true;

    const stats = getDOMStats();

    // Use performance.now() which is relative to navigationStart
    // This is the most reliable way to measure time from start without negative values
    const renderTime = performance.now().toFixed(2);

    const frameworkName = window.frameworkName || "Benchmark";

    lastStats = `
      <div style="color: #fff; font-weight: bold; margin-bottom: 5px;">[${frameworkName} Scanner]</div>
      <div style="height: 1px; background: #333; margin: 5px 0;"></div>
      <div>Render Time: <span style="color: #fff">${renderTime}ms</span></div>
      <div>Total DOM Nodes: <span style="color: #fff">${stats.totalNodes}</span></div>
      <div>Max DOM Depth: <span style="color: #fff">${stats.maxDepth}</span></div>
      <div>Cards: <span style="color: #fff">${stats.cardCount}</span></div>
      <div>JS Heap: <span style="color: #fff">${stats.memory}</span></div>
      <div style="font-size: 9px; color: #666; margin-top: 4px;">*Heap available in Chrome only</div>
    `;

    contentElement.innerHTML = lastStats;

    setTimeout(() => {
      isUpdating = false;
    }, 0);
  }

  function debounce(func, wait) {
    let timeout;
    return function () {
      clearTimeout(timeout);
      timeout = setTimeout(func, wait);
    };
  }

  const initScanner = () => {
    if (document.getElementById("benchmark-stats")) return;

    const content = createStatsPanel();
    const debouncedUpdate = debounce(() => updateStats(content), 150);

    // Updates to capture framework hydration/render completion
    setTimeout(() => updateStats(content), 100);
    setTimeout(() => updateStats(content), 500);
    setTimeout(() => updateStats(content), 1500);

    const observer = new MutationObserver((mutations) => {
      const hasRealMutation = mutations.some(
        (m) => !m.target.closest || !m.target.closest("#benchmark-stats"),
      );
      if (hasRealMutation) {
        debouncedUpdate();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false,
    });

    console.log("Benchmark DOM Scanner fixed and ready.");
  };

  if (
    document.readyState === "complete" ||
    document.readyState === "interactive"
  ) {
    initScanner();
  } else {
    window.addEventListener("DOMContentLoaded", initScanner);
  }
})();
