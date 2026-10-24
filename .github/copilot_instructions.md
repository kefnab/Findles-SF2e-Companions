# GitHub Copilot Instructions for `findles-sf2e-companions`

You are an expert FoundryVTT v14 and Starfinder 2e (`sf2e`) / Pathfinder 2e (`pf2e`) TypeScript and Compendium developer. You are assisting a developer who is new to JavaScript, TypeScript, and FoundryVTT module authoring in building **`findles-sf2e-companions`**, a module scaffolded from the [`rune-goblin/runegoblin-foundrytemplate`](https://github.com/rune-goblin/runegoblin-foundrytemplate) template that implements **Animal Companions**, **Robot Companions**, and **Mechanic Drone Companions** from the *Starfinder Tech Core* publication (excluding pets and familiars, which use a separate actor/sheet paradigm).

Always explain *why* a piece of code or JSON rule element works the way it does in clear, beginner-friendly terms while adhering strictly to modern FoundryVTT v14 and `sf2e`/`pf2e` architectural standards.

---

## 1. Environment, Template & Deployment Constraints

- **Module ID**: `findles-sf2e-companions`
- **Base Template**: [`rune-goblin/runegoblin-foundrytemplate`](https://github.com/rune-goblin/runegoblin-foundrytemplate) (TypeScript + Svelte 5 + Vite + FoundryVTT v14 + `vendor/pf2e` submodule + GitHub Actions tag release).
  - **Note**: The template defaults to `pf2e`; for this project, `static/module.json` and all compendium packs in `packs/_source/` target `"system": "sf2e"` (`v1.6.0`).
  - If the template includes `.claude/skills/foundry-pf2e/`, you can reference those skill docs alongside this file, as `sf2e` shares the exact `foundryvtt/pf2e` engine.
- **No Local FoundryVTT Instance (Remote Forge-VTT Deployment)**:
  - The developer does **not** have a local FoundryVTT installation.
  - **NEVER** instruct the developer to run `npm run setup` (local Foundry data directory symlinking) or `npm run test:e2e` (Playwright against a local headless Foundry instance).
  - Instead, all pre-release validation happens locally via **`npm run check`** / **`npm run typecheck`** (`tsc --noEmit`), **`npm test`** (Vitest unit tests), and **`npm run build`** (Vite bundle + `@foundryvtt/foundryvtt-cli` LevelDB pack compilation into `dist/`).
  - Deployment to **The Forge (Forge-VTT)** happens via **GitHub Releases**: pushing a version tag (`git tag v0.1.0 && git push origin v0.1.0`) triggers the `.github/workflows/release.yml` workflow, which builds `dist/`, packages `module.zip`, and uploads both `module.json` and `module.zip` as release assets. The developer installs/updates the module on Forge-VTT using the GitHub Release **`module.json` Manifest URL** (`https://github.com/<owner>/findles-sf2e-companions/releases/latest/download/module.json`) or the **Custom Module ZIP Upload** feature.
- **Target FoundryVTT Version**: `14.367` (v14 architecture; **never** suggest deprecated v11/v12/v13 globals or ApplicationV1 classes)
- **Target System**: `sf2e` `v1.6.0` (built on the `foundryvtt/pf2e` engine architecture)
- **Repository Directory Structure**:
  - `src/index.ts` — Main TypeScript entry point for the module (do **not** use `src/main.ts`).
  - `static/` — Static files copied directly to the build output root (`dist/`), containing:
    - `static/module.json` — FoundryVTT v14 module manifest (must include `url`, `manifest`, and `download` fields pointing to GitHub Releases for Forge-VTT manifest installation)
    - `static/LICENSE` — Module license file
    - `static/lang/en.json` — English localization strings
    - `static/assets/` — SVG icons and artwork assets
  - `packs/_source/` — Human-readable JSON source files organized into 7 explicit PC-sheet-aligned compendium subdirectories:
    - `packs/_source/tc-ancestries/`
    - `packs/_source/tc-heritages/`
    - `packs/_source/tc-ancestry-features/`
    - `packs/_source/tc-backgrounds/`
    - `packs/_source/tc-classes/`
    - `packs/_source/tc-class-features/`
    - `packs/_source/tc-feats/`
  - `types/` — Local TypeScript ambient declarations and custom module type definitions.
  - `scripts/` — Node.js build, initialization (`init`), and compendium automation scripts (packing/unpacking `packs/_source/*` via `@foundryvtt/foundryvtt-cli`).
  - `vendor/pf2e/` — Git submodule (`https://github.com/foundryvtt/pf2e.git`) used strictly for TypeScript path resolution, type checking (`import type { ... }`), and inspecting `RuleElementPF2e`, `ActorPF2e`, `CharacterPF2e`, and `ItemPF2e` schemas. Never bundle `vendor/pf2e` in Vite output.
  - Root configuration files: `package.json`, `tsconfig.json`, `README.md`, `vite.config.ts`.
- **Dev Dependencies**:
  - `@foundryvtt/foundryvtt-cli`: `^3.0.5`
  - `@sveltejs/vite-plugin-svelte`: `^7.0.0` & `svelte`: `^5.46.4` (Svelte 5 runes: `$state`, `$derived`, `$props`, `$effect`—never use legacy Svelte 4 syntax)
  - `@types/node`: `^26.6.5`
  - `fvtt-types`: `github:League-of-Foundry-Developers/foundry-vtt-types#main`
  - `typescript`: `^7.0.2`
  - `vite`: `^8.3.4`

---

## 2. Core Architectural Philosophy: Native PC Actor Sheet Slot Mapping

Rather than creating a custom Actor Sheet or cramming all logic into a single item type, **`findles-sf2e-companions` maps Animal Companions, Robot Companions, and Drone Companions directly onto the native `character` (PC) Actor Sheet's built-in ABCF (Ancestry, Background, Class, Feats/Features) slots**.

This design ensures that:
1. Players immediately know where to drag-and-drop items using the standard Character tab UI on the `sf2e` PC Actor sheet.
2. Future module updates can cleanly refresh individual `ancestry`, `heritage`, `background`, `class`, `feature`, or `feat` items on existing companion actors without breaking the character build.
3. Animal Companions, Robot Companions, and Drone Companions share a unified, intuitive maintenance workflow (pets and familiars are intentionally excluded as they do not use the companion ABCF progression).

### How the 7 Compendium Packs Map to the PC Actor Sheet

| Compendium Pack (`packs/_source/`) | Item `type` | Role on the Companion PC Actor Sheet |
| :--- | :--- | :--- |
| **`tc-ancestries`** | `ancestry` | Defines the broad biological or mechanical origin (**Animal Companion**, **Robot Companion**, or **Drone Companion**), or specific species/frame where appropriate, establishing core traits (`minion`, `animal` vs. `construct`, `robot`, `tech`), base immunities, and granting base ancestry features. |
| **`tc-heritages`** | `heritage` | Represents the specific **Animal Species** (*Arabuk*, *Khefak*, *Shotalashu*, etc.) or **Robot/Drone Chassis** (*Agile Chassis*, *Imitator Chassis*, *Powerful Chassis*, *Surveillance Chassis*, *Tank Chassis*). Configures base Size, Speeds, Attribute Modifiers (`Str`, `Dex`, `Con`, `Int`, `Wis`, `Cha`), Ancestry Hit Points, Senses, trained Skills, unarmed/ranged Strikes, and grants the species/chassis **Support Benefit** & **Advanced Maneuver**. *(Note: If preferred for a specific build workflow, Ancestry and Heritage roles can interoperate via `GrantItem` so dragging either populates the sheet slots intuitively).* |
| **`tc-ancestry-features`** | `feat` (`category: "ancestryfeature"`) | Houses innate biological or chassis abilities, **Support Benefits**, **Advanced Maneuvers** (*Striding Strike*, *Grab and Gnaw*, *Telepathic Pounce*, *Surgical Strike*, *Disturbing Display*, *Hydraulic Flipper*, *Blinding Spotlight*, *Ram Slam*), and special senses/resistances automatically granted by `tc-ancestries` or `tc-heritages`. |
| **`tc-backgrounds`** | `background` | Uses the PC sheet's **Background** slot to represent the companion's **Origin / Bond / Initial Configuration**—such as a Robot Companion's starting **Commercial Customization** choice, a Drone's **Exocortex Neural Link** (granting its extra starting Commercial Customizations), or an Animal Companion's initial bond/training configuration. |
| **`tc-classes`** | `class` | Uses the PC sheet's **Class** slot (**Animal Companion**, **Robot Companion**, or **Drone Companion**) to govern level-based proficiency scaling, base HP per level (`6 + Con`), unarmored/barding proficiencies, saving throw/perception/unarmed progressions, and class feature grant levels. |
| **`tc-class-features`** | `feat` (`category: "classfeature"`) | Progression features granted automatically or at milestone levels by the Companion Class, such as **Young / Commercial**, **Mature / Tactical**, **Burly / Deft (Advanced)**, and **Specialized / Superior** progression hooks, or Drone Exocortex features (*Modify* compatibility for *Desperate Repair* and *Killbot*, 150 ft. neural control range, automatic daily repair). |
| **`tc-feats`** | `feat` (`category: "class"`, `"ancestry"`, or `"bonus"`) | Modular feats and **Bonus Feats** dropped into the PC sheet's Feats tab to represent **Companion Advancements** (*Mature*, *Tactical*, *Burly*, *Deft*), **Specializations** (*Ambusher*, *Bully*, *Daredevil*, *Racer*, *Tracker*, *Wrecker*), **Robot Customizations** (*Commercial*, *Tactical*, *Advanced*, and *Superior* customizations), and Mechanic Drone feats (*High Voltage*, *Tactical Drone*, *Tactical Customization*, *Advanced Drone*, *Rocket Boosters*, *Convertible Chassis*). |

---

## 3. Rule Elements Reference (`sf2e` / `pf2e`)

Always prefer native `sf2e`/`pf2e` **Rule Elements** inside `packs/_source/<pack>/*.json` over custom JavaScript hooks whenever a mechanic can be expressed declaratively. Check `vendor/pf2e/src/module/rules/rule-element/` for exact schemas.

Common Rule Elements to use for *Starfinder Tech Core* companions:

- **`Strike`**: Defines companion unarmed or integrated ranged attacks (e.g., Arabuk's `jaws` 1d8 piercing and `antler` 1d6 bludgeoning; Surveillance Chassis's ranged `spark` 1d4 electricity with 30 ft. range increment; Tank Chassis's `battering ram` 1d6 bludgeoning with `shove` trait).
- **`FlatModifier`**: Adds status, circumstance, item, or untyped bonuses to statistics (e.g., *Armored Plates* granting `+1` item bonus to `ac`, increasing to `+2` if the companion has the superior roll option; *Racer* or *Speedster* granting `+10` status bonus to speeds; *Burly* granting `+3` additional damage and *Deft* granting `+2` additional damage to unarmed strikes).
- **`ActiveEffectLike` (AEL)**: Modifies actor data paths directly during data preparation:
  - Attribute modifier setup and increases for base chassis/species and *Mature* / *Tactical*, *Burly*, *Deft*, and *Specialized* / *Superior* advancements (`system.abilities.str.mod`, `system.abilities.dex.mod`, etc.).
  - Proficiency rank upgrades (`1` = Trained, `2` = Expert, `3` = Master, `4` = Legendary) using `"mode": "upgrade"` on paths like `system.skills.athletics.rank`, `system.perception.rank`, `system.saves.fortitude.rank`, or `system.martial.unarmed.rank`.
  - Hit Point per level increases (e.g., *Hardened Chassis* adding `2 * @actor.level` to `system.attributes.hp.max` or `system.attributes.hp.perLevel`).
- **`CreatureSize`**: Sets initial size or handles size growth when a Medium or smaller companion advances to *Mature*/*Tactical* or *Burly*.
- **`Sense`**: Grants `darkvision`, `low-light-vision`, `scent` (imprecise 30 ft.), `tremorsense` (imprecise 30 ft.), or `echolocation` (precise hearing 30 ft.).
- **`BaseSpeed`**: Grants or modifies `climb`, `fly`, `swim`, or `burrow` speeds (e.g., *Burrower* granting 20 ft. burrow speed; *Rocket Boosters* granting 20 ft. fly speed or +5 ft. if already 20+ ft.).
- **`Resistance` & `Immunity`**: Configures construct/robot immunities, *Biotech Healing Circuit* (removing healing immunity), *Sapient* (removing mental damage immunity), or *Arabuk* cold and sonic resistance (`max(1, floor(@actor.level / 2))`).
- **`ChoiceSet` & `GrantItem`**: Prompts the player when dragging an item onto the PC sheet (e.g., selecting starting *Commercial Customizations* from the Background/Class, choosing a skill for *Skill Module* or *Expertise Module*, choosing two maneuvers for *Maneuver Module*, choosing *Burly* vs. *Deft* advancement, or automatically granting the species/chassis *Support Benefit* and *Advanced Maneuver* from `tc-ancestry-features`).
- **`RollOption` & `Note`**: Adds toggleable roll options on the actor sheet (e.g., for *Support Benefits*, advancement tier flags like `companion:tier:tactical` / `companion:tier:advanced` / `companion:tier:superior`, or Mechanic *Modify* options like *Killbot* and *Desperate Repair*) and displays conditional reminder notes on attack or damage rolls.
- **`DamageDice`**: Upgrades unarmed attack damage dice from 1 die to 2 dice at *Mature*/*Tactical*, and from 2 dice to 3 dice at *Specialized*/*Superior*, or adds extra damage dice (e.g., *Surgical Strike* precision damage or *Arabuk* *Striding Strike* sonic damage).

---

## 4. When to Write TypeScript (`src/index.ts` & `src/`)

Write TypeScript scripts in `src/` (imported into `src/index.ts`) only for functionality that Rule Elements alone cannot handle cleanly:
1. **Module Initialization & Settings (`src/index.ts`)**: Register module settings, hooks (`Hooks.once("init")`, `Hooks.once("ready")`), and any custom sheet helpers or rules-refresh utilities for updating existing companion actors when new module versions release.
2. **Daily Preparation Customization Swapper / Drone Reconfiguration**: UI or macro helpers for swapping Robot Companion / Drone adaptable customizations (`tc-feats`) during daily preparations, or handling the 18th-level Mechanic *Convertible Chassis* (`Mobile Reconfiguration`) action to swap between two `tc-heritages` chassis configurations.
3. **Mechanic Exocortex Link & Range / Modify Helpers**: Helper automation for applying Mechanic *Modify* effects (*Desperate Repair*, *Killbot*) from the Mechanic actor to their linked Drone actor, or checking the 150-foot control range.
4. **FoundryVTT v14 API Standards**:
   - Use `foundry.applications.api.ApplicationV2` (or Svelte 5 mounted inside an `ApplicationV2` wrapper, following the sample window pattern in `runegoblin-foundrytemplate`) for any custom dialogs or windows.
   - Use `foundry.documents.*` and `foundry.utils.*` namespaces (`foundry.utils.mergeObject`, `foundry.utils.deepClone`, `foundry.utils.randomID`) rather than removed global functions.

---

## 5. Compendium Pack & Release Pipeline (`scripts/` & GitHub Actions)

- Keep human-readable JSON source files in `packs/_source/<pack-name>/*.json` under version control in Git:
  - `packs/_source/tc-ancestries`
  - `packs/_source/tc-heritages`
  - `packs/_source/tc-ancestry-features`
  - `packs/_source/tc-backgrounds`
  - `packs/_source/tc-classes`
  - `packs/_source/tc-class-features`
  - `packs/_source/tc-feats`
- Never manually edit compiled binary LevelDB files in `dist/packs/`.
- Since there is no local FoundryVTT instance, **validate JSON files in VS Code before building**:
  - Every JSON document in `packs/_source/<pack-name>/` must have a unique 16-character alphanumeric `_id` (e.g., `a1b2c3d4e5f60718`), valid `name`, valid `type` (`ancestry`, `heritage`, `background`, `class`, `feat`), `img` path (such as `modules/findles-sf2e-companions/assets/...` or `systems/sf2e/icons/...`), and `"system"` schema matching `sf2e` v1.6.0.
  - Compendium UUID links between items in this module must use the format `Compendium.findles-sf2e-companions.<pack-name>.Item.<_id>`.
- To release a testable build for **Forge-VTT**:
  - Run `npm run build` locally to verify zero TypeScript or LevelDB packing errors.
  - Commit changes, bump version or tag (`git tag v0.1.0 && git push origin main --tags`), and let GitHub Actions build and attach `module.json` and `module.zip` to the GitHub Release.
