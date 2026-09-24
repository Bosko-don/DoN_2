// electron/preload.ts
var import_electron = require("electron");
import_electron.contextBridge.exposeInMainWorld("electronAPI", {
  platform: process.platform,
  isElectron: true,
  getVersion: () => process.env.npm_package_version || "1.0.0"
});
