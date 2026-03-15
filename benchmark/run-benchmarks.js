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
  if (!fs.existsSync(assetsDir)) return { size: 0, gzip: 0 };

  const files = fs.readdirSync(assetsDir);
  const jsFile = files.find((f) => f.endsWith(".js"));
  if (!jsFile) return { size: 0, gzip: 0 };

  const stats = fs.statSync(path.join(assetsDir, jsFile));
  return { size: stats.size / 1024, gzip: 0 };
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
      memoryHeap: 0,
    };

    // Benchmark 1: Initial Load & Rendering
    const startLoad = performance.now();
    await page.goto(`http://localhost:${fw.port}`, {
      waitUntil: "networkidle",
      timeout: 60000,
    });
    await page.waitForSelector(".card", { timeout: 30000 });
    metrics.loadTime = performance.now() - startLoad;

    // Benchmark 2: Memory Usage
    await new Promise((resolve) => setTimeout(resolve, 5000));
    const memory = await page.evaluate(() => {
      return window.performance.memory
        ? window.performance.memory.usedJSHeapSize
        : 0;
    });
    metrics.memoryHeap = memory / (1024 * 1024);

    // Benchmark 3: Reactivity / Filtering
    const input = page.locator("input");
    const startFilter = performance.now();
    await input.pressSequentially("Task 2499", { delay: 10 });
    await page.waitForFunction(
      () => {
        const cards = document.querySelectorAll(".card");
        return cards.length > 0 && cards.length <= 10;
      },
      { timeout: 90000 },
    );
    metrics.filterTime = performance.now() - startFilter;

    // Benchmark 4: Drag & Drop Interaction
    await input.clear();
    await page.waitForFunction(
      () => document.querySelectorAll(".card").length > 9000,
      { timeout: 60000 }
    );

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
      { timeout: 10000 },
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
    `Starting Parallel Framework Stress Test (10,000 Cards, ${NUM_ROUNDS} rounds per framework)...`,
  );

  const servers = [];
  const allStats = {};

  try {
    // 1. Build all frameworks sequentially (to avoid resource contention during build)
    console.log("\n\x1b[1mPhase 1: Building all frameworks...\x1b[0m");
    for (const fw of FRAMEWORKS) {
      const fwDir = path.join(ROOT_DIR, fw.dir);
      process.stdout.write(`  Building ${fw.name}... `);
      execSync("pnpm run build", { cwd: fwDir, stdio: "ignore" });
      process.stdout.write(`Done\n`);
    }

    // 2. Start all servers
    console.log("\n\x1b[1mPhase 2: Starting preview servers...\x1b[0m");
    for (const fw of FRAMEWORKS) {
      const fwDir = path.join(ROOT_DIR, fw.dir);
      process.stdout.write(`  Starting ${fw.name} on port ${fw.port}... `);
      const server = spawn("pnpm", ["run", "preview", "--port", fw.port.toString()], {
        cwd: fwDir,
        detached: true,
        stdio: "ignore",
      });
      servers.push({ fw, process: server });
    }
    // Wait for all servers to be ready
    await new Promise((resolve) => setTimeout(resolve, 5000));
    console.log("All servers ready.");

    // 3. Run Rounds in parallel across frameworks
    console.log(`\n\x1b[1mPhase 3: Executing benchmarks (Parallel Frameworks, Sequential Rounds)...\x1b[0m`);

    const benchmarkPromises = FRAMEWORKS.map(async (fw) => {
      allStats[fw.name] = [];
      for (let i = 1; i <= NUM_ROUNDS; i++) {
        try {
          const metrics = await runFrameworkBenchmark(fw);
          allStats[fw.name].push(metrics);
          console.log(`  ${fw.color}✔ [${fw.name}] Round ${i}/${NUM_ROUNDS} completed\x1b[0m`);
        } catch (err) {
          console.error(`  ${fw.color}✘ [${fw.name}] Round ${i}/${NUM_ROUNDS} failed: ${err.message}\x1b[0m`);
        }
      }
    });

    await Promise.all(benchmarkPromises);

    // 4. Cleanup servers
    console.log("\n\x1b[1mPhase 4: Cleaning up...\x1b[0m");
    for (const s of servers) {
      if (s.process.pid) {
        try {
          process.kill(-s.process.pid);
        } catch (e) {}
      }
    }

    // 5. Calculate averages
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
        memoryHeap: stats.reduce((acc, s) => acc + s.memoryHeap, 0) / stats.length,
      };
      finalResults.push(avg);
    }

    // 6. Final Comparison Table
    console.log(
      "\n\x1b[1m\x1b[32m%s\x1b[0m",
      `Final Averaged Results (${NUM_ROUNDS} Rounds per framework):`,
    );
    const tableData = finalResults.map((r) => ({
      Framework: r.name,
      "Bundle (KB)": r.bundleSize,
      "Load (ms)": r.loadTime.toFixed(2),
      "Filter (ms)": r.filterTime.toFixed(2),
      "DragDrop (ms)": r.dragDropTime.toFixed(2),
      "Memory (MB)": r.memoryHeap.toFixed(2),
    }));

    console.table(tableData);

    // 7. Generate report
    const reportPath = path.join(ROOT_DIR, "BENCHMARK_REPORT.md");
    let markdown = `# Benchmark Results - ${new Date().toISOString().split("T")[0]}\n\n`;
    markdown += `*Results are averages of **${NUM_ROUNDS} rounds**. Frameworks were tested in parallel environments.*\n\n`;
    markdown +=
      "| Framework | Bundle (KB) | Load (ms) | Filter (ms) | DragDrop (ms) | Memory (MB) |\n";
    markdown += "| :--- | :---: | :---: | :---: | :---: | :---: |\n";

    tableData.forEach((row) => {
      markdown += `| ${row.Framework} | ${row["Bundle (KB)"]} | ${row["Load (ms)"]} | ${row["Filter (ms)"]} | ${row["DragDrop (ms)"]} | ${row["Memory (MB)"]} |\n`;
    });

    fs.writeFileSync(reportPath, markdown);
    console.log(`\nMarkdown report generated: ${reportPath}`);

    process.exit(0);
  } catch (err) {
    console.error("\nUnexpected error during benchmark execution:", err);
    for (const s of servers) {
      if (s.process.pid) {
        try {
          process.kill(-s.process.pid);
        } catch (e) {}
      }
    }
    process.exit(1);
  }
}

runBenchmark().catch((err) => {
  console.error(err);
  process.exit(1);
});
