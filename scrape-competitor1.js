import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const TARGET_URL = "https://www.jbl.com/wireless-earbuds/";
const SCRAPER_NAME = "jbl-wireless-earbuds";
const SCRAPER_DESCRIPTION =
  "For each product on the page, extract the product name and price";
const CONFIG_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  "scraper-create-output.json"
);

function quoteArg(arg) {
  if (/[\s"]/.test(arg)) {
    return `"${arg.replace(/"/g, '\\"')}"`;
  }
  return arg;
}

function runBrightData(args) {
  const quotedArgs = args.map(quoteArg);
  return execFileSync("brightdata", quotedArgs, {
    encoding: "utf8",
    maxBuffer: 50 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
    shell: true,
  });
}
function loadCollectorId() {
  if (process.env.BRIGHTDATA_COLLECTOR_ID) {
    return process.env.BRIGHTDATA_COLLECTOR_ID;
  }

  if (existsSync(CONFIG_PATH)) {
    const config = JSON.parse(readFileSync(CONFIG_PATH, "utf8"));
    if (config.collector_id) {
      return config.collector_id;
    }
  }

  return null;
}

function createScraper() {
  const output = runBrightData([
    "scraper",
    "create",
    TARGET_URL,
    SCRAPER_DESCRIPTION,
    "--name",
    SCRAPER_NAME,
    "--json",
    "--pretty",
    "-o",
    CONFIG_PATH,
  ]);

  if (!existsSync(CONFIG_PATH)) {
    return JSON.parse(output).collector_id;
  }

  return JSON.parse(readFileSync(CONFIG_PATH, "utf8")).collector_id;
}

function normalizeProducts(raw) {
  const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
  const rows = Array.isArray(parsed)
    ? parsed
    : parsed?.data ?? parsed?.results ?? parsed?.items ?? [parsed];

  return rows
    .flatMap((row) => {
      if (!row || typeof row !== "object") {
        return [];
      }

      const name =
        row.name ??
        row.product_name ??
        row.productName ??
        row.title ??
        row.product ??
        null;
      const price =
        row.price ??
        row.product_price ??
        row.productPrice ??
        row.current_price ??
        row.sale_price ??
        null;

      if (!name && !price) {
        return [];
      }

      return [{ name, price }];
    })
    .filter((item) => item.name || item.price);
}

async function main() {
  let collectorId = loadCollectorId();

  if (!collectorId) {
    console.error("No scraper found. Creating one with Bright Data CLI...");
    collectorId = createScraper();
  }

  const raw = runBrightData([
    "scraper",
    "run",
    collectorId,
    TARGET_URL,
    "--json",
    "--pretty",
  ]);

  const products = normalizeProducts(raw);
  console.log(JSON.stringify(products, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});