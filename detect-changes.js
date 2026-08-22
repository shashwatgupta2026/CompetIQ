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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getAiSummary(competitor, productName, oldPrice, newPrice, retries = 2) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.NVIDIA_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "meta/llama-3.3-70b-instruct",
          messages: [
            {
              role: "user",
              content: `A competitor price changed. Competitor: ${competitor}. Product: ${productName}. Old price: ${oldPrice}. New price: ${newPrice}. In one short plain-English sentence, describe this change for a business dashboard.`,
            },
          ],
          temperature: 0.3,
          max_tokens: 100,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(`NVIDIA API error: ${JSON.stringify(data)}`);
      }
      return data.choices[0].message.content.trim();
    } catch (err) {
      console.error(`   Attempt ${attempt} failed: ${err.message}`);
      if (attempt < retries) await sleep(2000);
    }
  }
  return null;
}

async function main() {
  const competitors = ["jbl", "bose", "skullcandy"];
  let anyChangesFound = false;

  for (const competitor of competitors) {
    const { data: rows, error } = await supabase
      .from("price_snapshots")
      .select("*")
      .eq("competitor", competitor)
      .order("scraped_at", { ascending: true });

    if (error) {
      console.error(`Error fetching ${competitor}:`, error.message);
      continue;
    }

    const byProduct = {};
    for (const row of rows) {
      const key = row.product_name || "unknown";
      if (!byProduct[key]) byProduct[key] = [];
      byProduct[key].push(row);
    }

    for (const [productName, entries] of Object.entries(byProduct)) {
      if (entries.length < 2) continue;

      const previous = entries[entries.length - 2];
      const latest = entries[entries.length - 1];

      if (previous.price === "[object Object]") continue;
      if (previous.price !== latest.price) {
        anyChangesFound = true;
        console.log(`\n🔔 CHANGE DETECTED — [${competitor}] "${productName}"`);
        console.log(`   ${previous.price} → ${latest.price}`);

        const summary = await getAiSummary(competitor, productName, previous.price, latest.price);
        if (summary) {
          console.log(`   AI summary: ${summary}`);
          const { error: insertError } = await supabase.from("insights").insert({
            competitor,
            summary,
          });
          if (insertError) {
            console.error(`   Failed to save insight: ${insertError.message}`);
          }
        } else {
          console.log("   Skipping AI summary — API unavailable after retries.");
        }

        await sleep(1500);
      }
    }
  }

  if (!anyChangesFound) {
    console.log("\nNo price changes detected across any competitor.");
  }
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});