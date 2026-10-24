export const MODULE_ID = "findles-starfinder-helper" as const;

Hooks.once("init", () => {
  console.log(`${MODULE_ID} | Initializing Findle's Starfinder Helper`);

  if (!game.settings) return;

  game.settings.register(MODULE_ID, "enableWelcome", {
    name: "FINDLES_SF2E.Settings.EnableWelcome.Name",
    hint: "FINDLES_SF2E.Settings.EnableWelcome.Hint",
    scope: "client",
    config: true,
    type: Boolean,
    default: true
  });
});

Hooks.once("ready", () => {
  if (!game.settings || !game.i18n) return;

  const showWelcome = game.settings.get(MODULE_ID, "enableWelcome");
  if (showWelcome) {
    const message = game.i18n.localize("FINDLES_SF2E.WelcomeMessage");
    ui.notifications?.info(message);
  }
});