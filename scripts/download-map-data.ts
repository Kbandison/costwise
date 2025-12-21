/**
 * Download US TopoJSON map data from topojson/us-atlas
 *
 * Usage: npx tsx scripts/download-map-data.ts
 */

import * as fs from "fs";
import * as path from "path";

const US_ATLAS_BASE = "https://cdn.jsdelivr.net/npm/us-atlas@3";

interface DownloadConfig {
  url: string;
  outputPath: string;
  description: string;
}

const DOWNLOADS: DownloadConfig[] = [
  {
    url: `${US_ATLAS_BASE}/states-10m.json`,
    outputPath: "public/data/us-states.json",
    description: "US States TopoJSON (10m resolution)",
  },
  {
    url: `${US_ATLAS_BASE}/counties-10m.json`,
    outputPath: "public/data/us-counties.json",
    description: "US Counties TopoJSON (10m resolution)",
  },
  {
    url: `${US_ATLAS_BASE}/nation-10m.json`,
    outputPath: "public/data/us-nation.json",
    description: "US Nation outline TopoJSON",
  },
];

async function downloadFile(config: DownloadConfig): Promise<void> {
  console.log(`Downloading: ${config.description}`);
  console.log(`  URL: ${config.url}`);

  const response = await fetch(config.url);

  if (!response.ok) {
    throw new Error(`Failed to download ${config.url}: ${response.status}`);
  }

  const data = await response.json();

  // Ensure directory exists
  const dir = path.dirname(config.outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Write file
  fs.writeFileSync(config.outputPath, JSON.stringify(data));

  const stats = fs.statSync(config.outputPath);
  console.log(`  Saved to: ${config.outputPath} (${formatBytes(stats.size)})`);
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function main(): Promise<void> {
  console.log("=".repeat(60));
  console.log("Downloading US Map Data");
  console.log("=".repeat(60));
  console.log();

  for (const config of DOWNLOADS) {
    try {
      await downloadFile(config);
      console.log();
    } catch (error) {
      console.error(`Error downloading ${config.description}:`, error);
      // Continue with other downloads
    }
  }

  console.log("=".repeat(60));
  console.log("Download complete!");
  console.log("=".repeat(60));

  // Print summary
  console.log("\nFiles created:");
  for (const config of DOWNLOADS) {
    if (fs.existsSync(config.outputPath)) {
      const stats = fs.statSync(config.outputPath);
      console.log(`  - ${config.outputPath} (${formatBytes(stats.size)})`);
    } else {
      console.log(`  - ${config.outputPath} (MISSING)`);
    }
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
