import { MODULE_ID } from "./constants";

/** Prefix shared by every localization key this module uses for compendium content. */
const PACK_KEY_PREFIX = "FSC.Packs.";

/** Returns the localized text if `value` is one of our keys, otherwise returns `value` unchanged. */
function localizePackKey(value: string | null | undefined): string | null | undefined {
  if (typeof value !== "string" || !value.startsWith(PACK_KEY_PREFIX)) return value;
  return game.i18n!.localize(value);
}

/**
 * Compendium items store localization keys (e.g. "FSC.Packs.AncestryEntries.DroneCompanion.Name")
 * as their names, since Foundry does not translate item names itself. Replace any key text
 * displayed inside a rendered application with its localized string.
 */
function localizeRenderedKeys(element: HTMLElement): void {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (node.nodeValue?.trim().startsWith(PACK_KEY_PREFIX)) nodes.push(node as Text);
  }
  for (const node of nodes) {
    node.nodeValue = localizePackKey(node.nodeValue?.trim()) ?? node.nodeValue;
  }
  for (const el of element.querySelectorAll<HTMLElement>("[data-tooltip], [title], [aria-label]")) {
    for (const attr of ["data-tooltip", "title", "aria-label"]) {
      const value = el.getAttribute(attr);
      if (value?.startsWith(PACK_KEY_PREFIX)) el.setAttribute(attr, localizePackKey(value) as string);
    }
  }
}

function localizeOnRender(_app: unknown, html: unknown): void {
  const element = html instanceof HTMLElement ? html : (html as { 0?: unknown } | undefined)?.[0];
  if (element instanceof HTMLElement) localizeRenderedKeys(element);
}

Hooks.once("init", () => {
  console.log(`${MODULE_ID} | Initializing Findle's Starfinder Helper`);

  game.settings!.register(MODULE_ID, "enableWelcome", {
    name: "FINDLES_SF2E.Settings.EnableWelcome.Name",
    hint: "FINDLES_SF2E.Settings.EnableWelcome.Hint",
    scope: "client",
    config: true,
    type: Boolean,
    default: true
  });
});

// Localize the item's name as it is copied onto an actor (e.g. dragging the ancestry onto a sheet,
// or the ancestry granting its features), so the actor keeps readable text.
Hooks.on("preCreateItem", (item: any) => {
  const localized = localizePackKey(item.name);
  if (localized && localized !== item.name) item.updateSource({ name: localized });
});

// Localize keys shown in compendium windows, the sidebar directory, and item sheets.
for (const hook of ["renderCompendium", "renderCompendiumDirectory", "renderItemSheet"]) {
  Hooks.on(hook as any, localizeOnRender as any);
}

Hooks.once("ready", () => {
  if (!game.settings!.get(MODULE_ID, "enableWelcome")) return;
  ui.notifications!.info(game.i18n!.localize("FINDLES_SF2E.WelcomeMessage"));
});
