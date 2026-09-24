var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/dotenv/lib/main.js
var require_main = __commonJS({
  "node_modules/dotenv/lib/main.js"(exports2, module2) {
    var fs2 = require("fs");
    var path2 = require("path");
    var os = require("os");
    var crypto = require("crypto");
    var TIPS = [
      "\u25C8 encrypted .env [www.dotenvx.com]",
      "\u25C8 secrets for agents [www.dotenvx.com]",
      "\u2301 auth for agents [www.vestauth.com]",
      "\u2318 custom filepath { path: '/custom/path/.env' }",
      "\u2318 enable debugging { debug: true }",
      "\u2318 override existing { override: true }",
      "\u2318 suppress logs { quiet: true }",
      "\u2318 multiple files { path: ['.env.local', '.env'] }"
    ];
    function _getRandomTip() {
      return TIPS[Math.floor(Math.random() * TIPS.length)];
    }
    function parseBoolean(value) {
      if (typeof value === "string") {
        return !["false", "0", "no", "off", ""].includes(value.toLowerCase());
      }
      return Boolean(value);
    }
    function supportsAnsi() {
      return process.stdout.isTTY;
    }
    function dim(text) {
      return supportsAnsi() ? `\x1B[2m${text}\x1B[0m` : text;
    }
    var LINE = /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/mg;
    function parse(src) {
      const obj = {};
      let lines = src.toString();
      lines = lines.replace(/\r\n?/mg, "\n");
      let match;
      while ((match = LINE.exec(lines)) != null) {
        const key = match[1];
        let value = match[2] || "";
        value = value.trim();
        const maybeQuote = value[0];
        value = value.replace(/^(['"`])([\s\S]*)\1$/mg, "$2");
        if (maybeQuote === '"') {
          value = value.replace(/\\n/g, "\n");
          value = value.replace(/\\r/g, "\r");
        }
        obj[key] = value;
      }
      return obj;
    }
    function _parseVault(options) {
      options = options || {};
      const vaultPath = _vaultPath(options);
      options.path = vaultPath;
      const result = DotenvModule.configDotenv(options);
      if (!result.parsed) {
        const err = new Error(`MISSING_DATA: Cannot parse ${vaultPath} for an unknown reason`);
        err.code = "MISSING_DATA";
        throw err;
      }
      const keys = _dotenvKey(options).split(",");
      const length = keys.length;
      let decrypted;
      for (let i = 0; i < length; i++) {
        try {
          const key = keys[i].trim();
          const attrs = _instructions(result, key);
          decrypted = DotenvModule.decrypt(attrs.ciphertext, attrs.key);
          break;
        } catch (error) {
          if (i + 1 >= length) {
            throw error;
          }
        }
      }
      return DotenvModule.parse(decrypted);
    }
    function _warn(message) {
      console.error(`\u26A0 ${message}`);
    }
    function _debug(message) {
      console.log(`\u2506 ${message}`);
    }
    function _log(message) {
      console.log(`\u25C7 ${message}`);
    }
    function _dotenvKey(options) {
      if (options && options.DOTENV_KEY && options.DOTENV_KEY.length > 0) {
        return options.DOTENV_KEY;
      }
      if (process.env.DOTENV_KEY && process.env.DOTENV_KEY.length > 0) {
        return process.env.DOTENV_KEY;
      }
      return "";
    }
    function _instructions(result, dotenvKey) {
      let uri;
      try {
        uri = new URL(dotenvKey);
      } catch (error) {
        if (error.code === "ERR_INVALID_URL") {
          const err = new Error("INVALID_DOTENV_KEY: Wrong format. Must be in valid uri format like dotenv://:key_1234@dotenvx.com/vault/.env.vault?environment=development");
          err.code = "INVALID_DOTENV_KEY";
          throw err;
        }
        throw error;
      }
      const key = uri.password;
      if (!key) {
        const err = new Error("INVALID_DOTENV_KEY: Missing key part");
        err.code = "INVALID_DOTENV_KEY";
        throw err;
      }
      const environment = uri.searchParams.get("environment");
      if (!environment) {
        const err = new Error("INVALID_DOTENV_KEY: Missing environment part");
        err.code = "INVALID_DOTENV_KEY";
        throw err;
      }
      const environmentKey = `DOTENV_VAULT_${environment.toUpperCase()}`;
      const ciphertext = result.parsed[environmentKey];
      if (!ciphertext) {
        const err = new Error(`NOT_FOUND_DOTENV_ENVIRONMENT: Cannot locate environment ${environmentKey} in your .env.vault file.`);
        err.code = "NOT_FOUND_DOTENV_ENVIRONMENT";
        throw err;
      }
      return { ciphertext, key };
    }
    function _vaultPath(options) {
      let possibleVaultPath = null;
      if (options && options.path && options.path.length > 0) {
        if (Array.isArray(options.path)) {
          for (const filepath of options.path) {
            if (fs2.existsSync(filepath)) {
              possibleVaultPath = filepath.endsWith(".vault") ? filepath : `${filepath}.vault`;
            }
          }
        } else {
          possibleVaultPath = options.path.endsWith(".vault") ? options.path : `${options.path}.vault`;
        }
      } else {
        possibleVaultPath = path2.resolve(process.cwd(), ".env.vault");
      }
      if (fs2.existsSync(possibleVaultPath)) {
        return possibleVaultPath;
      }
      return null;
    }
    function _resolveHome(envPath2) {
      return envPath2[0] === "~" ? path2.join(os.homedir(), envPath2.slice(1)) : envPath2;
    }
    function _configVault(options) {
      const debug = parseBoolean(process.env.DOTENV_CONFIG_DEBUG || options && options.debug);
      const quiet = parseBoolean(process.env.DOTENV_CONFIG_QUIET || options && options.quiet);
      if (debug || !quiet) {
        _log("loading env from encrypted .env.vault");
      }
      const parsed = DotenvModule._parseVault(options);
      let processEnv = process.env;
      if (options && options.processEnv != null) {
        processEnv = options.processEnv;
      }
      DotenvModule.populate(processEnv, parsed, options);
      return { parsed };
    }
    function configDotenv(options) {
      const dotenvPath = path2.resolve(process.cwd(), ".env");
      let encoding = "utf8";
      let processEnv = process.env;
      if (options && options.processEnv != null) {
        processEnv = options.processEnv;
      }
      let debug = parseBoolean(processEnv.DOTENV_CONFIG_DEBUG || options && options.debug);
      let quiet = parseBoolean(processEnv.DOTENV_CONFIG_QUIET || options && options.quiet);
      if (options && options.encoding) {
        encoding = options.encoding;
      } else {
        if (debug) {
          _debug("no encoding is specified (UTF-8 is used by default)");
        }
      }
      let optionPaths = [dotenvPath];
      if (options && options.path) {
        if (!Array.isArray(options.path)) {
          optionPaths = [_resolveHome(options.path)];
        } else {
          optionPaths = [];
          for (const filepath of options.path) {
            optionPaths.push(_resolveHome(filepath));
          }
        }
      }
      let lastError;
      const parsedAll = {};
      for (const path3 of optionPaths) {
        try {
          const parsed = DotenvModule.parse(fs2.readFileSync(path3, { encoding }));
          DotenvModule.populate(parsedAll, parsed, options);
        } catch (e) {
          if (debug) {
            _debug(`failed to load ${path3} ${e.message}`);
          }
          lastError = e;
        }
      }
      const populated = DotenvModule.populate(processEnv, parsedAll, options);
      debug = parseBoolean(processEnv.DOTENV_CONFIG_DEBUG || debug);
      quiet = parseBoolean(processEnv.DOTENV_CONFIG_QUIET || quiet);
      if (debug || !quiet) {
        const keysCount = Object.keys(populated).length;
        const shortPaths = [];
        for (const filePath of optionPaths) {
          try {
            const relative = path2.relative(process.cwd(), filePath);
            shortPaths.push(relative);
          } catch (e) {
            if (debug) {
              _debug(`failed to load ${filePath} ${e.message}`);
            }
            lastError = e;
          }
        }
        _log(`injected env (${keysCount}) from ${shortPaths.join(",")} ${dim(`// tip: ${_getRandomTip()}`)}`);
      }
      if (lastError) {
        return { parsed: parsedAll, error: lastError };
      } else {
        return { parsed: parsedAll };
      }
    }
    function config(options) {
      if (_dotenvKey(options).length === 0) {
        return DotenvModule.configDotenv(options);
      }
      const vaultPath = _vaultPath(options);
      if (!vaultPath) {
        _warn(`you set DOTENV_KEY but you are missing a .env.vault file at ${vaultPath}`);
        return DotenvModule.configDotenv(options);
      }
      return DotenvModule._configVault(options);
    }
    function decrypt(encrypted, keyStr) {
      const key = Buffer.from(keyStr.slice(-64), "hex");
      let ciphertext = Buffer.from(encrypted, "base64");
      const nonce = ciphertext.subarray(0, 12);
      const authTag = ciphertext.subarray(-16);
      ciphertext = ciphertext.subarray(12, -16);
      try {
        const aesgcm = crypto.createDecipheriv("aes-256-gcm", key, nonce);
        aesgcm.setAuthTag(authTag);
        return `${aesgcm.update(ciphertext)}${aesgcm.final()}`;
      } catch (error) {
        const isRange = error instanceof RangeError;
        const invalidKeyLength = error.message === "Invalid key length";
        const decryptionFailed = error.message === "Unsupported state or unable to authenticate data";
        if (isRange || invalidKeyLength) {
          const err = new Error("INVALID_DOTENV_KEY: It must be 64 characters long (or more)");
          err.code = "INVALID_DOTENV_KEY";
          throw err;
        } else if (decryptionFailed) {
          const err = new Error("DECRYPTION_FAILED: Please check your DOTENV_KEY");
          err.code = "DECRYPTION_FAILED";
          throw err;
        } else {
          throw error;
        }
      }
    }
    function populate(processEnv, parsed, options = {}) {
      const debug = Boolean(options && options.debug);
      const override = Boolean(options && options.override);
      const populated = {};
      if (typeof parsed !== "object") {
        const err = new Error("OBJECT_REQUIRED: Please check the processEnv argument being passed to populate");
        err.code = "OBJECT_REQUIRED";
        throw err;
      }
      for (const key of Object.keys(parsed)) {
        if (Object.prototype.hasOwnProperty.call(processEnv, key)) {
          if (override === true) {
            processEnv[key] = parsed[key];
            populated[key] = parsed[key];
          }
          if (debug) {
            if (override === true) {
              _debug(`"${key}" is already defined and WAS overwritten`);
            } else {
              _debug(`"${key}" is already defined and was NOT overwritten`);
            }
          }
        } else {
          processEnv[key] = parsed[key];
          populated[key] = parsed[key];
        }
      }
      return populated;
    }
    var DotenvModule = {
      configDotenv,
      _configVault,
      _parseVault,
      config,
      decrypt,
      parse,
      populate
    };
    module2.exports.configDotenv = DotenvModule.configDotenv;
    module2.exports._configVault = DotenvModule._configVault;
    module2.exports._parseVault = DotenvModule._parseVault;
    module2.exports.config = DotenvModule.config;
    module2.exports.decrypt = DotenvModule.decrypt;
    module2.exports.parse = DotenvModule.parse;
    module2.exports.populate = DotenvModule.populate;
    module2.exports = DotenvModule;
  }
});

// electron/main.ts
var import_electron = require("electron");
var import_node_path = __toESM(require("node:path"), 1);
var import_node_fs = __toESM(require("node:fs"), 1);
var import_node_http = __toESM(require("node:http"), 1);
var import_node_child_process = require("node:child_process");
var import_dotenv = __toESM(require_main(), 1);
var appRoot = import_electron.app.isPackaged ? import_node_path.default.resolve(process.resourcesPath, "app") : process.cwd();
var envPath = import_node_path.default.join(appRoot, ".env");
if (import_node_fs.default.existsSync(envPath)) {
  import_dotenv.default.config({ path: envPath });
} else {
  import_dotenv.default.config();
}
var isDev = !import_electron.app.isPackaged && process.env.NODE_ENV !== "production";
var SERVER_PORT = process.env.PORT || "3000";
var DEV_URL = process.env.ELECTRON_START_URL || process.env.VITE_DEV_SERVER_URL || `http://localhost:${SERVER_PORT}`;
var mainWindow = null;
var serverProcess = null;
function checkServerHealthy(url, timeoutMs = 800) {
  return new Promise((resolve) => {
    try {
      const parsedUrl = new URL(url);
      const req = import_node_http.default.get(
        {
          hostname: parsedUrl.hostname,
          port: parsedUrl.port,
          path: "/api/health",
          timeout: timeoutMs
        },
        (res) => {
          resolve(res.statusCode === 200 || res.statusCode !== void 0 && res.statusCode < 500);
        }
      );
      req.on("error", () => resolve(false));
      req.on("timeout", () => {
        req.destroy();
        resolve(false);
      });
    } catch {
      resolve(false);
    }
  });
}
async function waitForServer(url, maxAttempts = 50, delayMs = 400) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const ready = await checkServerHealthy(url);
    if (ready) return true;
    await new Promise((r) => setTimeout(r, delayMs));
  }
  return false;
}
async function startServerProcess() {
  const alreadyRunning = await checkServerHealthy(`http://localhost:${SERVER_PORT}`);
  if (alreadyRunning) {
    console.log(`[Electron Main] Detected existing server listening on port ${SERVER_PORT}.`);
    return;
  }
  console.log(`[Electron Main] Spawning backend server process...`);
  const serverEnv = {
    ...process.env,
    PORT: SERVER_PORT,
    NODE_ENV: isDev ? "development" : "production"
  };
  if (isDev) {
    const tsxPath = import_node_path.default.join(
      appRoot,
      "node_modules",
      ".bin",
      process.platform === "win32" ? "tsx.cmd" : "tsx"
    );
    if (import_node_fs.default.existsSync(tsxPath)) {
      serverProcess = (0, import_node_child_process.spawn)(tsxPath, ["server.ts"], {
        cwd: appRoot,
        env: serverEnv,
        stdio: "inherit",
        shell: process.platform === "win32"
      });
    } else {
      serverProcess = (0, import_node_child_process.spawn)("npx", ["tsx", "server.ts"], {
        cwd: appRoot,
        env: serverEnv,
        stdio: "inherit",
        shell: true
      });
    }
  } else {
    const bundledServerPath = import_node_path.default.join(appRoot, "dist", "server.cjs");
    if (import_node_fs.default.existsSync(bundledServerPath)) {
      serverProcess = (0, import_node_child_process.spawn)(process.execPath, [bundledServerPath], {
        cwd: appRoot,
        env: serverEnv,
        stdio: "inherit"
      });
    } else {
      console.warn(`[Electron Main] Production server not found at ${bundledServerPath}`);
    }
  }
  if (serverProcess) {
    serverProcess.on("error", (err) => {
      console.error("[Electron Main] Failed to spawn server process:", err);
    });
    serverProcess.on("exit", (code, signal) => {
      console.log(`[Electron Main] Server process exited with code ${code}, signal ${signal}`);
      serverProcess = null;
    });
  }
}
function terminateServerProcess() {
  if (serverProcess && serverProcess.pid) {
    console.log("[Electron Main] Gracefully stopping server process...");
    try {
      if (process.platform === "win32") {
        (0, import_node_child_process.spawn)("taskkill", ["/pid", serverProcess.pid.toString(), "/f", "/t"]);
      } else {
        serverProcess.kill("SIGTERM");
      }
    } catch (err) {
      console.error("[Electron Main] Error terminating server process:", err);
    }
    serverProcess = null;
  }
}
function createMainWindow() {
  const iconIco = import_node_path.default.join(appRoot, "build", "icon.ico");
  const iconPng = import_node_path.default.join(appRoot, "build", "icon.png");
  const iconPath = process.platform === "win32" && import_node_fs.default.existsSync(iconIco) ? iconIco : import_node_fs.default.existsSync(iconPng) ? iconPng : void 0;
  mainWindow = new import_electron.BrowserWindow({
    title: "DoN (Diary of a Nerd) - University Study Organizer",
    width: 1366,
    height: 860,
    minWidth: 1280,
    minHeight: 800,
    resizable: true,
    show: false,
    // Prevent white flash before content loads
    icon: iconPath,
    backgroundColor: "#0f172a",
    // Match dark mode slate-900 initial background
    webPreferences: {
      preload: import_node_path.default.join(__dirname, "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  });
  import_electron.session.defaultSession.webRequest.onBeforeRequest(
    { urls: ["file://*/api/*", "*:///api/*"] },
    (details, callback) => {
      const idx = details.url.indexOf("/api/");
      if (idx !== -1) {
        const subPath = details.url.substring(idx);
        callback({ redirectURL: `http://localhost:${SERVER_PORT}${subPath}` });
        return;
      }
      callback({});
    }
  );
  mainWindow.once("ready-to-show", () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
  if (isDev) {
    console.log(`[Electron Main] Loading dev server from: ${DEV_URL}`);
    waitForServer(DEV_URL).then(() => {
      if (mainWindow) {
        mainWindow.loadURL(DEV_URL);
      }
    });
  } else {
    const distIndexPath = import_node_path.default.join(appRoot, "dist", "index.html");
    if (import_node_fs.default.existsSync(distIndexPath)) {
      console.log(`[Electron Main] Loading production bundle: ${distIndexPath}`);
      mainWindow.loadFile(distIndexPath);
    } else {
      console.log(`[Electron Main] Loading fallback URL: http://localhost:${SERVER_PORT}`);
      waitForServer(`http://localhost:${SERVER_PORT}`).then(() => {
        if (mainWindow) {
          mainWindow.loadURL(`http://localhost:${SERVER_PORT}`);
        }
      });
    }
  }
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}
import_electron.app.whenReady().then(async () => {
  await startServerProcess();
  createMainWindow();
  import_electron.app.on("activate", () => {
    if (import_electron.BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});
import_electron.app.on("window-all-closed", () => {
  terminateServerProcess();
  if (process.platform !== "darwin") {
    import_electron.app.quit();
  }
});
import_electron.app.on("before-quit", () => {
  terminateServerProcess();
});
import_electron.app.on("will-quit", () => {
  terminateServerProcess();
});
process.on("SIGINT", () => {
  terminateServerProcess();
  process.exit(0);
});
process.on("SIGTERM", () => {
  terminateServerProcess();
  process.exit(0);
});
