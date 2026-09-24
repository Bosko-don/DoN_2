/**
 * ==============================================================================
 * DoN (Diary of a Nerd) - Electron Desktop Application Main Process
 * ==============================================================================
 *
 * HOW TO RUN AND PACKAGE LOCALLY:
 * ------------------------------------------------------------------------------
 * 1. Install Dependencies:
 *      npm install
 *    (or if using bun: bun install)
 *
 * 2. Configure Environment:
 *    Ensure your `.env` file in the project root has your Gemini API key:
 *      GEMINI_API_KEY=your_gemini_api_key_here
 *    (The secret API key is securely loaded by the Express server process and
 *    is never bundled into or accessible by the Electron frontend renderer).
 *
 * 3. Launch Development Desktop App:
 *      npm run electron:dev
 *    This script compiles the Electron main script, concurrently starts the
 *    Express server with Vite middleware, and opens the desktop window
 *    pointing to the local dev server.
 *
 * 4. Build and Package Desktop App (Windows NSIS Installer):
 *      npm run electron:build
 *    This command:
 *      a) Builds the optimized React frontend into `dist/`
 *      b) Compiles `server.ts` into `dist/server.cjs`
 *      c) Bundles this Electron process into `dist-electron/main.cjs`
 *      d) Packages an installer (.exe) into the `release/` directory using
 *         electron-builder.
 * ==============================================================================
 */

import { app, BrowserWindow, session } from "electron";
import path from "node:path";
import fs from "node:fs";
import http from "node:http";
import { spawn, ChildProcess } from "node:child_process";
import dotenv from "dotenv";

// Resolve application root directory (works in both dev and packaged modes)
const appRoot = app.isPackaged
  ? path.resolve(process.resourcesPath, "app")
  : process.cwd();

// Load environment variables (.env) securely into the main process context
const envPath = path.join(appRoot, ".env");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const isDev = !app.isPackaged && process.env.NODE_ENV !== "production";
const SERVER_PORT = process.env.PORT || "3000";
const DEV_URL =
  process.env.ELECTRON_START_URL ||
  process.env.VITE_DEV_SERVER_URL ||
  `http://localhost:${SERVER_PORT}`;

let mainWindow: BrowserWindow | null = null;
let serverProcess: ChildProcess | null = null;

/**
 * Checks if a server is already listening and responsive on a given HTTP URL
 */
function checkServerHealthy(url: string, timeoutMs = 800): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const parsedUrl = new URL(url);
      const req = http.get(
        {
          hostname: parsedUrl.hostname,
          port: parsedUrl.port,
          path: "/api/health",
          timeout: timeoutMs,
        },
        (res) => {
          resolve(res.statusCode === 200 || (res.statusCode !== undefined && res.statusCode < 500));
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

/**
 * Polls until the backend server is ready or timeout is reached
 */
async function waitForServer(url: string, maxAttempts = 50, delayMs = 400): Promise<boolean> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const ready = await checkServerHealthy(url);
    if (ready) return true;
    await new Promise((r) => setTimeout(r, delayMs));
  }
  return false;
}

/**
 * Spawns the existing server.ts (in dev) or bundled dist/server.cjs (in prod)
 * as a managed child process so API calls route securely through the backend.
 */
async function startServerProcess(): Promise<void> {
  // If an instance is already running on the port (e.g. from concurrently), reuse it
  const alreadyRunning = await checkServerHealthy(`http://localhost:${SERVER_PORT}`);
  if (alreadyRunning) {
    console.log(`[Electron Main] Detected existing server listening on port ${SERVER_PORT}.`);
    return;
  }

  console.log(`[Electron Main] Spawning backend server process...`);

  // Environment to pass to the server process (including secret GEMINI_API_KEY)
  const serverEnv = {
    ...process.env,
    PORT: SERVER_PORT,
    NODE_ENV: isDev ? "development" : "production",
  };

  if (isDev) {
    // In development, execute server.ts via tsx
    const tsxPath = path.join(
      appRoot,
      "node_modules",
      ".bin",
      process.platform === "win32" ? "tsx.cmd" : "tsx"
    );

    if (fs.existsSync(tsxPath)) {
      serverProcess = spawn(tsxPath, ["server.ts"], {
        cwd: appRoot,
        env: serverEnv,
        stdio: "inherit",
        shell: process.platform === "win32",
      });
    } else {
      serverProcess = spawn("npx", ["tsx", "server.ts"], {
        cwd: appRoot,
        env: serverEnv,
        stdio: "inherit",
        shell: true,
      });
    }
  } else {
    // In production, execute the bundled dist/server.cjs
    const bundledServerPath = path.join(appRoot, "dist", "server.cjs");
    if (fs.existsSync(bundledServerPath)) {
      serverProcess = spawn(process.execPath, [bundledServerPath], {
        cwd: appRoot,
        env: serverEnv,
        stdio: "inherit",
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

/**
 * Cleanly terminates the child server process when Electron closes
 */
function terminateServerProcess(): void {
  if (serverProcess && serverProcess.pid) {
    console.log("[Electron Main] Gracefully stopping server process...");
    try {
      if (process.platform === "win32") {
        // Force kill process tree on Windows to prevent orphaned background instances
        spawn("taskkill", ["/pid", serverProcess.pid.toString(), "/f", "/t"]);
      } else {
        serverProcess.kill("SIGTERM");
      }
    } catch (err) {
      console.error("[Electron Main] Error terminating server process:", err);
    }
    serverProcess = null;
  }
}

/**
 * Creates and configures the main desktop window
 */
function createMainWindow(): void {
  // Determine appropriate icon based on platform
  const iconIco = path.join(appRoot, "build", "icon.ico");
  const iconPng = path.join(appRoot, "build", "icon.png");
  const iconPath = process.platform === "win32" && fs.existsSync(iconIco)
    ? iconIco
    : fs.existsSync(iconPng)
    ? iconPng
    : undefined;

  mainWindow = new BrowserWindow({
    title: "DoN (Diary of a Nerd) - University Study Organizer",
    width: 1366,
    height: 860,
    minWidth: 1280,
    minHeight: 800,
    resizable: true,
    show: false, // Prevent white flash before content loads
    icon: iconPath,
    backgroundColor: "#0f172a", // Match dark mode slate-900 initial background
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  // Intercept file:// and relative fetch requests to route /api/* directly to the backend
  session.defaultSession.webRequest.onBeforeRequest(
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

  // Show window smoothly once ready
  mainWindow.once("ready-to-show", () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  // Load appropriate target
  if (isDev) {
    // In development, load the Vite dev server URL
    console.log(`[Electron Main] Loading dev server from: ${DEV_URL}`);
    waitForServer(DEV_URL).then(() => {
      if (mainWindow) {
        mainWindow.loadURL(DEV_URL);
      }
    });
  } else {
    // In production, load built static files from dist/ folder
    const distIndexPath = path.join(appRoot, "dist", "index.html");
    if (fs.existsSync(distIndexPath)) {
      console.log(`[Electron Main] Loading production bundle: ${distIndexPath}`);
      mainWindow.loadFile(distIndexPath);
    } else {
      // Fallback to local server URL if static file path is not directly accessible
      console.log(`[Electron Main] Loading fallback URL: http://localhost:${SERVER_PORT}`);
      waitForServer(`http://localhost:${SERVER_PORT}`).then(() => {
        if (mainWindow) {
          mainWindow.loadURL(`http://localhost:${SERVER_PORT}`);
        }
      });
    }
  }

  // Handle window close
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// App lifecycle management
app.whenReady().then(async () => {
  await startServerProcess();
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

// Clean up child process when closing
app.on("window-all-closed", () => {
  terminateServerProcess();
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  terminateServerProcess();
});

app.on("will-quit", () => {
  terminateServerProcess();
});

// Process signal safety
process.on("SIGINT", () => {
  terminateServerProcess();
  process.exit(0);
});

process.on("SIGTERM", () => {
  terminateServerProcess();
  process.exit(0);
});
