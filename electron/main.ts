import { app } from "electron";
import { createWindow } from "./window";
import { initVault, registerIpcHandlers } from "./ipc-handlers";

app.setAppUserModelId("com.pixelcodegh.VoidNotes");
app.whenReady().then(() => {
  registerIpcHandlers();
  initVault();
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  try {
    const { getMainWindow } = require("./window");
    if (!getMainWindow()) createWindow();
  } catch (error) {
    console.error("Failed to activate window:", error);
  }
});
