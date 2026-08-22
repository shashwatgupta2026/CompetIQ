import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const envFile = readFileSync(".env.local", "utf8");
const env = {};
envFile.split("\n").forEach((line) => {
  const [key, ...valueParts] = line.split("=");
  if (key && valueParts.length) {
    env[key.trim()] = valueParts.join("=").trim();
  }
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const COMPETITOR_NAME = "jlab";
const COLLECTOR_ID = "c_mt4eg2yi240zeyz2ro";
const TARGET_URL = "https://www.jlabaudio.com/collections/true-wireless";

function quoteArg(arg) {
  if (/[\s"]/.test(arg)) {
    return "\"" + arg.replace(/"/g, "\\\"") + "\"";
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

function normalizeProducts(raw) {
  const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
  const rows = Array.isArray(parsed)
    ? parsed
    : parsed?.data ?? parsed?.results ?? parsed?.items ?? [parsed];

  return rows
    .flatMap((row) => {
      if (!row || typeof row !== "object") return [];
      const name =
        row.name ?? row.product_name ?? row.productName ??
        (typeof row.title === "string"
          ? [...new Set(row.title.split(" "))].join(" ")
          : row.title) ?? row.product ?? null;
      const price =
        row.price ?? row.product_price ?? row.productPrice ??
        row.current_price ?? row.sale_price ?? null;
      const priceText =
        price && typeof price === "object"
          ? (price.symbol ?? "") + (price.value ?? "")
          : price;
      if (!name && !price) return [];
      return [{ name, price, priceText }];
    })
    .filter((item) => item.name || item.price);
}

async function main() {
  console.log("Scraping " + COMPETITOR_NAME + "...");
  const raw = runBrightData([
    "scraper",
    "run",
    COLLECTOR_ID,
    TARGET_URL,
    "--json",
    "--pretty",
  ]);

  const products = normalizeProducts(raw);
  console.log("Found " + products.length + " products.");

  if (products.length === 0) {
    console.log("No products found - nothing to save.");
    return;
  }

  const rows = products.map((p) => ({
    competitor: COMPETITOR_NAME,
    product_name: p.name,
    price: String(p.priceText ?? p.price ?? ""),
  }));

  const { data, error } = await supabase
    .from("price_snapshots")
    .insert(rows)
    .select();

  if (error) {
    console.error("Save to Supabase failed:", error.message);
    process.exit(1);
  }

  console.log("Saved " + data.length + " rows to Supabase.");
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});