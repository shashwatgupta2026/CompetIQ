import { readFileSync } from "node:fs";

const envFile = readFileSync(".env.local", "utf8");
const env = {};
envFile.split("\n").forEach((line) => {
  const [key, ...valueParts] = line.split("=");
  if (key && valueParts.length) {
    env[key.trim()] = valueParts.join("=").trim();
  }
});

async function main() {
  const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.NVIDIA_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "meta/llama-3.3-70b-instruct",
      messages: [{ role: "user", content: "Say hello in one word." }],
      max_tokens: 10,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    console.error("FAILED:", JSON.stringify(data));
    process.exit(1);
  }
  console.log("SUCCESS:", data.choices[0].message.content);
}

main();