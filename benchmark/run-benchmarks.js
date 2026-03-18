import { chromium } from "playwright";
import { execSync, spawn } from "child_process";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");
const NUM_ROUNDS = 3;

const FRAMEWORKS_LIST = [
  { name: "Svelte 5", dir: "svelte", port: 4173, color: "\x1b[38;5;208m", arg: "--svelte" },
  { name: "Vue 3.5", dir: "vue-3.5", port: 4174, color: "\x1b[32m", arg: "--vue" },
  { name: "Vue Vapor", dir: "vue-vapor", port: 4175, color: "\x1b[34m", arg: "--vapor" },
  { name: "SolidJS", dir: "solidjs", port: 4176, color: "\x1b[35m", arg: "--solid" },
  { name: "React 19", dir: "react", port: 4177, color: "\x1b[36m", arg: "--react" },
];

const args = process.argv.slice(2);
const FRAMEWORKS = args.length > 0
  ? FRAMEWORKS_LIST.filter(fw => args.includes(fw.arg))
  : FRAMEWORKS_LIST;

function getBundleSize(fwDir) {
  const assetsDir = path.join(fwDir, "dist", "assets");
  if (!fs.existsSync(assetsDir)) return { size: 0, chunks: [] };

  const files = fs.readdirSync(assetsDir);
  const jsFiles = files.filter((f) => f.endsWith(".js"));
  if (jsFiles.length === 0) return { size: 0, chunks: [] };

  let totalSize = 0;
  const chunks = [];
  for (const file of jsFiles) {
    const stats = fs.statSync(path.join(assetsDir, file));
    const size = stats.size;
    totalSize += size;
    chunks.push({ name: file, size: size / 1024 });
  }
  return { size: totalSize / 1024, chunks };
}

async function runFrameworkBenchmark(fw) {
  const browser = await chromium.launch({
    args: ["--enable-precise-memory-info", "--no-sandbox"],
  });

  try {
    const page = await browser.newPage();
    const metrics = {
      loadTime: 0,
      filterTime: 0,
      dragDropTime: 0,
      toggleTime: 0,
      swapTime: 0,
      memoryHeap: 0,
    };

    // Benchmark 1: Initial Load & Rendering (10,000 cards)
    const startLoad = performance.now();
    await page.goto(`http://localhost:${fw.port}`, {
      waitUntil: "networkidle",
      timeout: 90000,
    });
    await page.waitForSelector(".card", { timeout: 60000 });
    metrics.loadTime = performance.now() - startLoad;

    // Benchmark 2: Memory Usage (Idle)
    await new Promise((resolve) => setTimeout(resolve, 3000));
    const memory = await page.evaluate(() => {
      return window.performance.memory
        ? window.performance.memory.usedJSHeapSize
        : 0;
    });
    metrics.memoryHeap = memory / (1024 * 1024);

    // Benchmark 3: Reactivity / Filtering
    const input = page.locator("input");
    const startFilter = performance.now();
    await input.pressSequentially("Task 2499", { delay: 5 });
    await page.waitForFunction(
      () => {
        let count = 0;
        const cards = document.querySelectorAll(".card");
        for (const c of cards) {
          if (c.checkVisibility()) count++;
        }
        return count > 0 && count <= 10;
      },
      { timeout: 60000 },
    );
    metrics.filterTime = performance.now() - startFilter;

    // Reset filter for next tests
    await input.clear();
    await page.waitForFunction(
      () => {
        let count = 0;
        const cards = document.querySelectorAll(".card");
        for (const c of cards) {
          if (c.checkVisibility()) count++;
        }
        return count > 9000;
      },
      { timeout: 60000 }
    );

    // Benchmark 4: Massive Toggle (Reactivity Stress - All 10k cards)
    const initialPriority = await page.evaluate(() => document.querySelector(".priority-tag")?.innerText.trim());
    const startToggle = performance.now();
    await page.click("#bench-toggle");
    await page.waitForFunction((prev) => {
      const el = document.querySelector(".priority-tag");
      return el && el.innerText.trim() !== prev;
    }, initialPriority, { timeout: 60000 });
    metrics.toggleTime = performance.now() - startToggle;

    // Benchmark 5: Massive Swap (Reconciliation Stress)
    const startSwap = performance.now();
    await page.click("#bench-swap");
    // Give it time to move DOM nodes
    await new Promise(r => setTimeout(r, 500));
    metrics.swapTime = performance.now() - startSwap;

    // Benchmark 6: Drag & Drop Interaction
    const sourceCard = page.locator(".column:first-child .card:first-child");
    const targetColumn = page.locator(".column:last-child");
    const cardIdBefore = await sourceCard.evaluate(
      (el) => el.innerText.split("\n")[0],
    );

    const startDrag = performance.now();
    await sourceCard.dragTo(targetColumn);
    await page.waitForFunction(
      (expectedTitle) => {
        const lastColCards = document
          .querySelector(".column:last-child")
          .querySelectorAll(".card-title");
        return Array.from(lastColCards).some((c) =>
          c.innerText.includes(expectedTitle),
        );
      },
      cardIdBefore,
      { timeout: 30000 },
    );
    metrics.dragDropTime = performance.now() - startDrag;

    await browser.close();
    return metrics;
  } catch (err) {
    await browser.close();
    throw err;
  }
}

async function runBenchmark() {
  console.log(
    "\x1b[1m\x1b[33m%s\x1b[0m",
    `Starting Sequential Framework Stress Test (10,000 Cards, ${NUM_ROUNDS} rounds per framework)...`,
  );

  const allStats = {};

  try {
    // 1. Build all frameworks sequentially
    console.log("\n\x1b[1mPhase 1: Building all frameworks...\x1b[0m");
    for (const fw of FRAMEWORKS) {
      const fwDir = path.join(ROOT_DIR, fw.dir);
      process.stdout.write(`  Building ${fw.name}... `);
      execSync("pnpm run build", { cwd: fwDir, stdio: "ignore" });
      process.stdout.write(`Done\n`);
    }

    // 2. Run Benchmarks Sequentially (One framework at a time to maximize CPU availability)
    console.log(`\n\x1b[1mPhase 2: Executing benchmarks sequentially...\x1b[0m`);

    for (const fw of FRAMEWORKS) {
      console.log(`\nTesting ${fw.color}${fw.name}\x1b[0m:`);
      const fwDir = path.join(ROOT_DIR, fw.dir);

      // Start preview server for this framework
      process.stdout.write(`  Starting server on port ${fw.port}... `);
      const server = spawn("pnpm", ["run", "preview", "--port", fw.port.toString()], {
        cwd: fwDir,
        detached: true,
        stdio: "ignore",
      });

      // Wait for server
      await new Promise((resolve) => setTimeout(resolve, 3000));
      console.log("Ready.");

      allStats[fw.name] = [];
      for (let i = 1; i <= NUM_ROUNDS; i++) {
        try {
          const metrics = await runFrameworkBenchmark(fw);
          allStats[fw.name].push(metrics);
          console.log(`  ✔ Round ${i}/${NUM_ROUNDS} completed`);
        } catch (err) {
          console.error(`  ✘ Round ${i}/${NUM_ROUNDS} failed: ${err.message}`);
        }
      }

      // Cleanup server for this framework
      if (server.pid) {
        try {
          process.kill(-server.pid);
        } catch (e) {}
      }
    }

    // 3. Calculate averages and results
    const finalResults = [];
    for (const fw of FRAMEWORKS) {
      const stats = allStats[fw.name];
      if (!stats || stats.length === 0) continue;

      const fwDir = path.join(ROOT_DIR, fw.dir);
      const bundleData = getBundleSize(fwDir);

      const avg = {
        name: fw.name,
        bundleSize: bundleData.size.toFixed(2),
        loadTime: stats.reduce((acc, s) => acc + s.loadTime, 0) / stats.length,
        filterTime: stats.reduce((acc, s) => acc + s.filterTime, 0) / stats.length,
        dragDropTime: stats.reduce((acc, s) => acc + s.dragDropTime, 0) / stats.length,
        toggleTime: stats.reduce((acc, s) => acc + s.toggleTime, 0) / stats.length,
        swapTime: stats.reduce((acc, s) => acc + s.swapTime, 0) / stats.length,
        memoryHeap: stats.reduce((acc, s) => acc + s.memoryHeap, 0) / stats.length,
      };
      finalResults.push(avg);
    }

    // 4. Final Comparison Table
    console.log(
      "\n\x1b[1m\x1b[32m%s\x1b[0m",
      `Final Averaged Results (${NUM_ROUNDS} Rounds per framework):`,
    );
    const tableData = finalResults.map((r) => ({
      Framework: r.name,
      "Bundle (KB)": r.bundleSize,
      "Load (ms)": r.loadTime.toFixed(2),
      "Filter (ms)": r.filterTime.toFixed(2),
      "Toggle (ms)": r.toggleTime.toFixed(2),
      "Swap (ms)": r.swapTime.toFixed(2),
      "DragDrop (ms)": r.dragDropTime.toFixed(2),
      "Memory (MB)": r.memoryHeap.toFixed(2),
    }));

    console.table(tableData);

    // 5. Generate report
    const reportPath = path.join(ROOT_DIR, "BENCHMARK_REPORT.md");
    let markdown = `# Benchmark Results - ${new Date().toISOString().split("T")[0]}\n\n`;
    markdown += `*Results are averages of **${NUM_ROUNDS} rounds**, executed sequentially to minimize resource contention.*\n\n`;
    markdown +=
      "| Framework | Bundle (KB) | Load (ms) | Filter (ms) | Toggle (ms) | Swap (ms) | DragDrop (ms) | Memory (MB) |\n";
    markdown += "| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |\n";

    tableData.forEach((row) => {
      markdown += `| ${row.Framework} | ${row["Bundle (KB)"]} | ${row["Load (ms)"]} | ${row["Filter (ms)"]} | ${row["Toggle (ms)"]} | ${row["Swap (ms)"]} | ${row["DragDrop (ms)"]} | ${row["Memory (MB)"]} |\n`;
    });

    fs.writeFileSync(reportPath, markdown);
    console.log(`\nMarkdown report generated: ${reportPath}`);

    process.exit(0);
  } catch (err) {
    console.error("\nUnexpected error during benchmark execution:", err);
    process.exit(1);
  }
}

runBenchmark().catch((err) => {
  console.error(err);
  process.exit(1);
});
