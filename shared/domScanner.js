/**
 * Benchmark DOM Scanner
 * Generic utility to measure Initial Render and DOM complexity across frameworks.
 * Includes visual mutation highlighting (react-scan style) for all frameworks.
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

  const spikeStyles = `
    position: absolute;
    top: 10px;
    right: 10px;
    width: 10px;
    height: 10px;
    background: red;
    border-radius: 2px;
    display: none;
    box-shadow: 0 0 5px red;
  `;

  let isUpdating = false;
  let lastStats = "";
  let lastFrameTime = performance.now();
  let spikeTimeout = null;

  // Mutation Highlighting Canvas
  let canvas, ctx;
  const activeHighlights = new Map();

  function initCanvas() {
    canvas = document.createElement("canvas");
    canvas.id = "mutation-scanner-overlay";
    canvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 9998;
    `;
    document.body.appendChild(canvas);
    ctx = canvas.getContext("2d");

    window.addEventListener("resize", () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    });
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function highlightElement(el) {
    if (
      !el ||
      el === canvas ||
      el.id === "benchmark-stats" ||
      el.closest("#benchmark-stats")
    )
      return;

    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    activeHighlights.set(el, {
      rect: { x: rect.left, y: rect.top, w: rect.width, h: rect.height },
      opacity: 1.0,
      timestamp: performance.now(),
    });
  }

  function drawHighlights() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const now = performance.now();
    activeHighlights.forEach((data, el) => {
      const age = now - data.timestamp;
      const life = 300; // ms
      if (age > life) {
        activeHighlights.delete(el);
        return;
      }

      const opacity = 1 - age / life;
      ctx.strokeStyle = `rgba(0, 255, 0, ${opacity})`;
      ctx.lineWidth = 2;
      ctx.strokeRect(data.rect.x, data.rect.y, data.rect.w, data.rect.h);

      // Optional: Flash background
      ctx.fillStyle = `rgba(0, 255, 0, ${opacity * 0.1})`;
      ctx.fillRect(data.rect.x, data.rect.y, data.rect.w, data.rect.h);
    });

    requestAnimationFrame(drawHighlights);
  }

  function createStatsPanel() {
    const container = document.createElement("div");
    container.id = "benchmark-stats";
    container.style.cssText = statsStyles;

    const spike = document.createElement("div");
    spike.id = "spike-indicator";
    spike.style.cssText = spikeStyles;
    container.appendChild(spike);

    const content = document.createElement("div");
    content.id = "benchmark-content";
    container.appendChild(content);

    const copyBtn = document.createElement("button");
    copyBtn.innerText = "Copy";
    copyBtn.style.cssText = buttonStyles;

    copyBtn.onclick = (e) => {
      e.stopPropagation();
      const textToCopy = lastStats.replace(/<[^>]*>/g, "").trim();
      navigator.clipboard.writeText(textToCopy).then(() => {
        const originalText = copyBtn.innerText;
        copyBtn.innerText = "copied!";
        setTimeout(() => {
          copyBtn.innerText = originalText;
        }, 1500);
      });
    };

    container.appendChild(copyBtn);
    document.body.appendChild(container);
    return content;
  }

  function monitorSpikes() {
    const now = performance.now();
    const delta = now - lastFrameTime;
    lastFrameTime = now;

    if (delta > 32) {
      const spike = document.getElementById("spike-indicator");
      if (spike) {
        spike.style.display = "block";
        clearTimeout(spikeTimeout);
        spikeTimeout = setTimeout(() => {
          spike.style.display = "none";
        }, 150);
      }
    }
    requestAnimationFrame(monitorSpikes);
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

    initCanvas();
    drawHighlights();

    const content = createStatsPanel();
    const debouncedUpdate = debounce(() => updateStats(content), 150);

    const observer = new MutationObserver((mutations) => {
      let hasRealMutation = false;
      mutations.forEach((m) => {
        if (
          m.target.closest &&
          !m.target.closest("#benchmark-stats") &&
          m.target !== canvas
        ) {
          hasRealMutation = true;
          if (m.type === "childList") {
            m.addedNodes.forEach(
              (node) => node.nodeType === 1 && highlightElement(node),
            );
          } else {
            highlightElement(m.target);
          }
        }
      });

      if (hasRealMutation) {
        debouncedUpdate();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    requestAnimationFrame(monitorSpikes);
    console.log("Benchmark DOM Scanner with Visual Scan ready.");
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
