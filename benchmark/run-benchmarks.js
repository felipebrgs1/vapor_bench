import { chromium } from "playwright";
import { execSync, spawn } from "child_process";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");

const FRAMEWORKS = [
  { name: "Svelte 5", dir: "svelte", port: 4173, color: "\x1b[38;5;208m" },
  { name: "Vue 3.5", dir: "vue-3.5", port: 4174, color: "\x1b[32m" },
  { name: "Vue Vapor", dir: "vue-vapor", port: 4175, color: "\x1b[34m" },
  { name: "SolidJS", dir: "solidjs", port: 4176, color: "\x1b[35m" },
];

function getBundleSize(fwDir) {
  const assetsDir = path.join(fwDir, "dist", "assets");
  if (!fs.existsSync(assetsDir)) return { size: 0, gzip: 0 };

  const files = fs.readdirSync(assetsDir);
  const jsFile = files.find((f) => f.endsWith(".js"));
  if (!jsFile) return { size: 0, gzip: 0 };

  const stats = fs.statSync(path.join(assetsDir, jsFile));
  return { size: stats.size / 1024, gzip: 0 }; // Gzip is measured by Vite during build, here we take raw
}

async function runBenchmark() {
  console.log(
    "\x1b[1m\x1b[33m%s\x1b[0m",
    "Starting Framework Stress Test (10,000 Cards + Drag & Drop)...",
  );

  const results = [];

  for (const fw of FRAMEWORKS) {
    console.log(`\n${fw.color}--- Benchmarking ${fw.name} --- \x1b[0m`);

    const fwDir = path.join(ROOT_DIR, fw.dir);
    let server;

    try {
      // 1. Build
      process.stdout.write(`  Building ${fw.name}... `);
      execSync("pnpm run build", { cwd: fwDir, stdio: "ignore" });
      const bundleData = getBundleSize(fwDir);
      process.stdout.write(`Done (${bundleData.size.toFixed(2)} KB)\n`);

      // 2. Start Preview Server
      process.stdout.write(`  Starting server on port ${fw.port}... `);
      server = spawn("pnpm", ["run", "preview", "--port", fw.port.toString()], {
        cwd: fwDir,
        detached: true,
        stdio: "ignore",
      });

      // Wait for server to be ready
      await new Promise((resolve) => setTimeout(resolve, 4000));
      process.stdout.write(`Ready!\n`);

      // Launch browser
      const browser = await chromium.launch({
        args: ["--enable-precise-memory-info", "--no-sandbox"],
      });

      const page = await browser.newPage();

      const metrics = {
        name: fw.name,
        bundleSize: bundleData.size.toFixed(2),
        loadTime: 0,
        filterTime: 0,
        dragDropTime: 0,
        memoryHeap: 0,
      };

      // Benchmark 1: Initial Load & Rendering
      process.stdout.write(`  Measuring Load Time (10,000 cards)... `);
      const startLoad = performance.now();
      await page.goto(`http://localhost:${fw.port}`, {
        waitUntil: "networkidle",
        timeout: 60000,
      });
      await page.waitForSelector(".card", { timeout: 30000 });
      metrics.loadTime = performance.now() - startLoad;
      process.stdout.write(`${metrics.loadTime.toFixed(2)} ms\n`);

      // Benchmark 2: Memory Usage
      process.stdout.write(`  Measuring Memory... `);
      await new Promise((resolve) => setTimeout(resolve, 5000));
      const memory = await page.evaluate(() => {
        return window.performance.memory
          ? window.performance.memory.usedJSHeapSize
          : 0;
      });
      metrics.memoryHeap = (memory / (1024 * 1024)).toFixed(2);
      process.stdout.write(`${metrics.memoryHeap} MB\n`);

      // Benchmark 3: Reactivity / Filtering
      process.stdout.write(`  Measuring Filter Time (Search 'Task 2499')... `);
      const input = page.locator("input");
      const startFilter = performance.now();
      await input.fill("Task 2499");
      await page.waitForFunction(
        () => {
          const cards = document.querySelectorAll(".card");
          return cards.length > 0 && cards.length < 20;
        },
        { timeout: 30000 },
      );
      metrics.filterTime = (performance.now() - startFilter).toFixed(2);
      process.stdout.write(`${metrics.filterTime} ms\n`);

      // Benchmark 4: Drag & Drop Interaction
      await input.fill("");
      await page.waitForFunction(
        () => document.querySelectorAll(".card").length > 9000,
      );

      process.stdout.write(
        `  Measuring Drag & Drop (Move card from Backlog to Done)... `,
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

      metrics.dragDropTime = (performance.now() - startDrag).toFixed(2);
      process.stdout.write(`${metrics.dragDropTime} ms\n`);

      results.push(metrics);

      await browser.close();

      if (server && server.pid) {
        try {
          process.kill(-server.pid);
        } catch (e) {}
      }
    } catch (err) {
      console.log(`\n  Error: ${err.message}`);
      if (server && server.pid) {
        try {
          process.kill(-server.pid);
        } catch (e) {}
      }
    }
  }

  // Final Comparison Table
  console.log(
    "\n\x1b[1m\x1b[32m%s\x1b[0m",
    "Final Stress Test Results (10,000 Cards):",
  );
  const tableData = results.map((r) => ({
    Framework: r.name,
    "Bundle (KB)": r.bundleSize,
    "Load (ms)": r.loadTime.toFixed(2),
    "Filter (ms)": r.filterTime,
    "DragDrop (ms)": r.dragDropTime,
    "Memory (MB)": r.memoryHeap,
  }));

  console.table(tableData);

  const reportPath = path.join(ROOT_DIR, "BENCHMARK_REPORT.md");
  let markdown = `# Benchmark Results - ${new Date().toISOString().split("T")[0]}\n\n`;
  markdown +=
    "| Framework | Bundle (KB) | Load (ms) | Filter (ms) | DragDrop (ms) | Memory (MB) |\n";
  markdown += "| :--- | :---: | :---: | :---: | :---: | :---: |\n";

  tableData.forEach((row) => {
    markdown += `| ${row.Framework} | ${row["Bundle (KB)"]} | ${row["Load (ms)"]} | ${row["Filter (ms)"]} | ${row["DragDrop (ms)"]} | ${row["Memory (MB)"]} |\n`;
  });

  fs.writeFileSync(reportPath, markdown);
  console.log(`\nMarkdown report generated: ${reportPath}`);

  process.exit(0);
}

runBenchmark().catch((err) => {
  console.error(err);
  process.exit(1);
});
