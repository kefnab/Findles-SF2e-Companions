// Extracts compiled LevelDB packs (dist/<manifest pack path>) back into packs/_source/<pack>/*.json.
// Useful after editing compendium content inside Foundry and exporting the pack folder into dist/.
import { extractPack } from "@foundryvtt/foundryvtt-cli";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { OUT_DIR, SOURCE_DIR, readManifestPacks } from "./manifest.ts";

/** Names are localization keys (FSC.Packs.<Group>.<Entry>.Name); use the entry segment, as kebab-case, for the file name. */
function fileSlug(doc: { name?: string; _id?: string }): string {
  const parts = String(doc.name ?? doc._id).split(".");
  const base = parts.length > 2 ? parts[parts.length - 2] : parts[0];
  return base.replace(/([a-z0-9])([A-Z])/g, "$1-$2").replace(/[^A-Za-z0-9]+/g, "-").toLowerCase();
}

for (const pack of readManifestPacks()) {
  const src = path.join(OUT_DIR, pack.path);
  if (!existsSync(src)) {
    console.warn(`Skipping ${pack.name}: no compiled pack at ${src}`);
    continue;
  }
  const dest = path.join(SOURCE_DIR, pack.name);
  mkdirSync(dest, { recursive: true });
  console.log(`Unpacking ${pack.name} -> ${dest}`);
  await extractPack(src, dest, {
    log: true,
    documentType: pack.type,
    transformName: (doc) => `${fileSlug(doc)}.json`
  });
}
