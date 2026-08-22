\# CompetIQ



A self-healing competitive intelligence dashboard, built for WeMakeDevs' "Into the Scrape-Verse" hackathon.



\*\*Live demo:\*\* https://compet-iq.vercel.app



\## The problem

Businesses want to track competitor pricing, but manual checking doesn't scale — and automated scrapers silently break whenever a website's layout changes.



\## What CompetIQ does

Tracks pricing for 3 real e-commerce brands (JBL, Bose, Skullcandy) using Bright Data Scraper Studio, detects price changes automatically, summarizes them in plain English using NVIDIA NIM (Llama 3.3 70B), and displays everything on a live dashboard with an overview, timeline, competitor breakdown, and scraper health log.



\## How Bright Data Scraper Studio is used

\- Each competitor has a scraper built via `brightdata scraper create`, using natural-language field descriptions — no manual CSS/selector work.

\- Scrapers are run repeatedly via `brightdata scraper run` and results are saved to Supabase automatically.



\## Self-healing proof (the core feature)

To test resilience, a real JBL page was copied and modified — the underlying `price` field in its data was renamed to `cost`, simulating a real site redesign — then hosted publicly via GitHub Pages.



We then used Bright Data's official healing workflow:

1\. `brightdata scraper heal <collector\_id> "<description of the change>"`

2\. `brightdata scraper approve <collector\_id>`

3\. Re-ran the scraper and manually verified the output — rather than blindly trusting the AI's fix.



\*\*Honest result:\*\* across 3 separate tests (a manual test and 2 heal attempts with increasingly specific prompts), the scraper consistently recovered pricing for products where the price also existed in the page's static visible content, but not for prices that only existed in the renamed dynamic data field. This is an explainable, reproducible finding — not a fabricated 100% success rate.



\## Tech stack

\- Bright Data Scraper Studio + CLI (scraping + self-healing)

\- Supabase (data storage)

\- NVIDIA NIM — Llama 3.3 70B (AI-generated change summaries)

\- Next.js + Tailwind + Recharts (dashboard, charts)

\- Vercel (hosting)



\## Security note

During development, API keys were briefly committed to the repository by accident. This was caught, `.env.local` and `node\_modules` were removed from version control, a `.gitignore` was added, and all exposed keys were rotated before final submission.



\## Setup

1\. Install Bright Data CLI: `npm install -g @brightdata/cli`

2\. Set up a Supabase project with `price\_snapshots` and `insights` tables

3\. Add your NVIDIA NIM API key

4\. Run the scraper scripts (`scrape-and-save-\*.js`)

5\. Run `detect-changes.js` to generate AI summaries

6\. `cd dashboard \&\& npm run dev` to preview the UI locally



\## Limitations \& future work

\- Currently monitors 3 competitors; could scale to more

\- Runs manually rather than on a schedule — a Vercel cron job would automate this

\- Self-healing recovers static content reliably but not all dynamically-rendered fields

