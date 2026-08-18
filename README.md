# CompetIQ# CompetIQ

# 

# A competitive intelligence dashboard built for WeMakeDevs' "Into the Scrape-Verse" hackathon.

# 

# \## What it does

# CompetIQ tracks pricing pages for competing e-commerce brands (JBL, Bose, Skullcandy), automatically detects changes, and will summarize what changed in plain English using AI.



# \## How Bright Data Scraper Studio is used

# Scraper Studio is the core data pipeline. For each competitor, a scraper was created using natural-language instructions (e.g. "extract the product name and price"), and Bright Data's AI automatically determines the correct selectors — without any manual HTML/CSS targeting.

# 

# \## Self-healing proof

# To test resilience, a local copy of JBL's page was modified (renaming the "price" field in the page's underlying data to "cost", simulating a real site redesign) and hosted publicly via GitHub Pages. The same JBL scraper was then run against this modified page. It successfully recovered pricing for products where price data existed outside the modified field, demonstrating partial self-healing — the scraper adapts and finds what data it still can, rather than failing completely.

# 

# \## Tech stack

# \- Bright Data Scraper Studio + CLI (scraping)

# \- Supabase (data storage)

# \- Node.js (automation scripts)

# \- Next.js (dashboard, in progress)

# \- Vercel (hosting, in progress)

# 

# \## Status

# Day 2 of 7 — 2 of 3 competitor scrapers fully working end-to-end, self-healing test in progress.

