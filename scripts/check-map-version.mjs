#!/usr/bin/env node
// Probes the OSRS wiki map tile server to confirm STAR_MAP_VERSION is still live.
// Exit 0 = current version works. Exit 1 = bump needed.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const starsPath = resolve(here, "../src/lib/data/stars.ts");
const source = readFileSync(starsPath, "utf8");
const match = source.match(/export const STAR_MAP_VERSION = "([^"]+)"/);

if (!match) {
  console.error("Could not locate STAR_MAP_VERSION in src/lib/data/stars.ts");
  process.exit(2);
}

const version = match[1];
// Canary: a tile that exists across all recent versions (Lumbridge area).
const url = `https://maps.runescape.wiki/osrs/versions/${version}/tiles/rendered/0/2/0_50_50.png`;

const res = await fetch(url, { method: "HEAD" }).catch((err) => {
  console.error(`Network error probing map version ${version}: ${err.message}`);
  process.exit(2);
});

if (res.ok) {
  console.log(`OK: STAR_MAP_VERSION=${version} is live (${res.status})`);
  process.exit(0);
}

console.error(`STALE: STAR_MAP_VERSION=${version} returned ${res.status}`);
console.error(`Check https://maps.runescape.wiki/osrs/ for the current version folder and bump src/lib/data/stars.ts.`);
process.exit(1);
