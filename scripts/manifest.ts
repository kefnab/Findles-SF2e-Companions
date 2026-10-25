import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

export const ROOT = path.resolve(import.meta.dirname, "..");
export const SOURCE_DIR = path.join(ROOT, "packs", "_source");
export const OUT_DIR = path.join(ROOT, "dist");

export interface ModulePack {
  name: string;
  path: string;
  type: string;
}

/** Reads the `packs` array from static/module.json so the manifest is the single source of truth. */
export function readManifestPacks(): ModulePack[] {
  const manifestPath = path.join(ROOT, "static", "module.json");
  if (!existsSync(manifestPath)) throw new Error(`Missing manifest: ${manifestPath}`);
  const manifest = JSON.parse(readFileSync(manifestPath, "utf-8")) as { packs?: ModulePack[] };
  return manifest.packs ?? [];
}
