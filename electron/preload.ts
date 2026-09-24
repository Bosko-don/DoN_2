import { contextBridge, ipcRenderer } from "electron";

/**
 * Secure Preload Script for DoN (Diary of a Nerd)
 * 
 * Enforces strict Context Isolation. No Node.js globals or sensitive
 * environment secrets (e.g. GEMINI_API_KEY) are exposed to the renderer.
 * All API calls flow strictly via the local Express server proxy.
 */
contextBridge.exposeInMainWorld("electronAPI", {
  platform: process.platform,
  isElectron: true,
  getVersion: () => process.env.npm_package_version || "1.0.0",
});
