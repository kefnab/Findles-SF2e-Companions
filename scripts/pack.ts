// Compiles packs/_source/<pack>/*.json into LevelDB packs under dist/<manifest pack path>.
// Run after `vite build` (which empties dist/) via `npm run build:packs`.
import { compilePack } from "@foundryvtt/foundryvtt-cli";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { OUT_DIR, SOURCE_DIR, readManifestPacks } from "./manifest.ts";

for (const pack of readManifestPacks()) {
  const src = path.join(SOURCE_DIR, pack.name);
  if (!existsSync(src)) {
    console.warn(`Skipping ${pack.name}: no source folder at ${src}`);
    continue;
  }
  const dest = path.join(OUT_DIR, pack.path);
  mkdirSync(path.dirname(dest), { recursive: true });
  console.log(`Packing ${pack.name} -> ${dest}`);
  await compilePack(src, dest, { recursive: true, log: true });
}
