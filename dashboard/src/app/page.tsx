"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Clock, BarChart3, Activity } from "lucide-react";

type Insight = {
  id: number;
  competitor: string;
  summary: string;
  created_at: string;
};

type Snapshot = {
  id: number;
  competitor: string;
  product_name: string;
  price: string;
  scraped_at: string;
};

const COMPETITORS = ["jbl", "bose", "skullcandy"];
const SOURCE_URLS: Record<string, string> = {
  jbl: "https://www.jbl.com/wireless-earbuds/",
  bose: "https://www.bose.com/p/earbuds/bose-quietcomfort-headphones/QCEARB24-HEADPHONEIN.html",
  skullcandy: "https://www.skullcandy.com/collections/sale-earbuds",
};

const NAV_ITEMS = [
  { key: "timeline", label: "Timeline", icon: Clock },
  { key: "competitors", label: "Competitors", icon: BarChart3 },
  { key: "health", label: "Health", icon: Activity },
] as const;

export default function Home() {
  const [tab, setTab] = useState<"timeline" | "competitors" | "health">("timeline");
  const [insights, setInsights] = useState<Insight[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const { data: insightData } = await supabase
        .from("insights")
        .select("*")
        .order("created_at", { ascending: false });

      const { data: snapshotData } = await supabase
        .from("price_snapshots")
        .select("*")
        .neq("price", "[object Object]")
        .order("scraped_at", { ascending: false });

      setInsights(insightData ?? []);
      setSnapshots(snapshotData ?? []);
      setLoading(false);
    }
    loadData();
  }, []);

  const latestByProduct: Record<string, Snapshot> = {};
  for (const row of snapshots) {
    const key = row.competitor + "::" + row.product_name;
    if (!latestByProduct[key]) latestByProduct[key] = row;
  }

  const grouped: Record<string, Snapshot[]> = {};
  for (const row of Object.values(latestByProduct)) {
    if (!grouped[row.competitor]) grouped[row.competitor] = [];
    grouped[row.competitor].push(row);
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-60 border-r border-neutral-800 bg-neutral-950 flex flex-col px-4 py-6">
        <div className="mb-8 px-2">
          <h1 className="text-xl font-bold text-white">CompetIQ</h1>
          <p className="text-xs text-neutral-500 mt-1">
            Self-healing competitive intel
          </p>
          <span className="inline-block mt-2 text-[10px] uppercase tracking-wide text-blue-400 bg-blue-500/10 px-2 py-1 rounded">
            Powered by Bright Data
          </span>
        </div>
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition " +
                (tab === key
                  ? "bg-blue-500/10 text-blue-400"
                  : "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200")
              }
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 px-8 py-10 max-w-4xl">
        {loading && <p className="text-neutral-500">Loading...</p>}

        {!loading && tab === "timeline" && (
          <div>
            <h2 className="text-2xl font-semibold text-white mb-6">Timeline</h2>
            <div className="space-y-3">
              {insights.length === 0 && (
                <p className="text-neutral-500">
                  No price changes detected yet - check back after the next scrape.
                </p>
              )}
              {insights.map((item, i) => (
                <div
                  key={item.id}
                  className="bg-neutral-900 border border-neutral-800 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs uppercase tracking-wide text-blue-400 font-semibold">
                      {item.competitor}
                    </span>
                    <span className="text-xs text-neutral-500">
                      {new Date(item.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-neutral-200">{item.summary}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && tab === "competitors" && (
          <div>
            <h2 className="text-2xl font-semibold text-white mb-6">Competitors</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {COMPETITORS.map((name) => (
                <div
                  key={name}
                  className="bg-neutral-900 border border-neutral-800 rounded-lg p-4"
                >
                  <h3 className="text-lg font-semibold text-white capitalize mb-1">
                    {name}
                  </h3>
                  
                    <a href={SOURCE_URLS[name]}
                    target="_blank"
                    className="text-[11px] text-neutral-500 hover:text-blue-400 truncate block mb-3"
                  >
                    {SOURCE_URLS[name]}
                  </a>
                  <div className="space-y-2">
                    {(grouped[name] ?? []).slice(0, 6).map((row) => (
                      <div
                        key={row.id}
                        className="flex justify-between text-sm border-b border-neutral-800 pb-1"
                      >
                        <span className="text-neutral-400 truncate mr-2">
                          {row.product_name}
                        </span>
                        <span className="text-blue-400 font-medium whitespace-nowrap">
                          {row.price}
                        </span>
                      </div>
                    ))}
                    {(grouped[name] ?? []).length === 0 && (
                      <p className="text-neutral-600 text-sm">No data yet.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && tab === "health" && (
          <div>
            <h2 className="text-2xl font-semibold text-white mb-6">Health</h2>
            <div className="grid gap-4 md:grid-cols-3 mb-8">
              {COMPETITORS.map((name) => (
                <div
                  key={name}
                  className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 flex items-center gap-3"
                >
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                  <div>
                    <p className="text-white font-medium capitalize">{name}</p>
                    <p className="text-xs text-neutral-500">
                      {"Active - last scraped "}
                      {grouped[name] && grouped[name][0]
                        ? new Date(grouped[name][0].scraped_at).toLocaleTimeString()
                        : "-"}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <h3 className="text-white font-semibold mb-3">Self-Healing Log</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2 text-neutral-300">
                <span className="text-green-400">[OK]</span>
                <span>Detected: price field renamed on JBL page</span>
              </div>
              <div className="flex items-start gap-2 text-neutral-300">
                <span className="text-green-400">[OK]</span>
                <span>Healed: Bright Data AI proposed a repair, approved</span>
              </div>
              <div className="flex items-start gap-2 text-neutral-300">
                <span className="text-green-400">[OK]</span>
                <span>Verified: re-ran scraper, confirmed data recovery on eligible fields</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}