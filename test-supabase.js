import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

// Load environment variables from .env.local manually
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

async function main() {
  const { data, error } = await supabase
    .from("price_snapshots")
    .insert([
      {
        competitor: "test",
        product_name: "Test Product",
        price: "$99.99",
      },
    ])
    .select();

  if (error) {
    console.error("Insert failed:", error.message);
    process.exit(1);
  }

  console.log("Insert succeeded:");
  console.log(JSON.stringify(data, null, 2));
}

main();