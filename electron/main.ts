import { app } from "electron";
import log from "electron-log";
import { createWindow, getMainWindow } from "./window";
import { initVault, registerIpcHandlers } from "./ipc-handlers";
import { initUpdater } from "./updater";

app.setAppUserModelId("com.pixelcodegh.VoidNotes");

log.catchErrors();

app.whenReady().then(() => {
  log.info("[app] Void Notes starting");
  registerIpcHandlers();
  const win = createWindow();
  log.info("[app] Window created");
  initVault();
  initUpdater(win);
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  try {
    const { getMainWindow } = require("./window");
    if (!getMainWindow()) createWindow();
  } catch (error) {
    log.error("[app] Failed to activate window:", error);
  }
});
