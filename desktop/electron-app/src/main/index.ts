import { app, shell, BrowserWindow, ipcMain } from 'electron';
import { join, dirname } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import { spawn, ChildProcess } from 'node:child_process';
import http from 'node:http';
import Store from 'electron-store';
import icon from '../../resources/icon.png?asset';

const store = new Store();

let pyProcess: ChildProcess | null = null;
const PORT = 5000;
const SERVER_URL = `http://127.0.0.1:${PORT}`;

/**
 * Spawns the PyInstaller executable as a child process.
 */
const startBackend = (): void => {
  const exePath = app.isPackaged
    ? join(process.resourcesPath, 'bin', 'main.exe')
    : join(__dirname, '../../cameraAPI/main.exe');

  console.log(`[Electron] Spawning backend binary at: ${exePath}`);

  pyProcess = spawn(exePath, [], {
    cwd: dirname(exePath),
    detached: false,
  });

  pyProcess.stdout?.on('data', (data: Buffer) => {
    console.log(`[FastAPI stdout]: ${data.toString().trim()}`);
  });

  pyProcess.stderr?.on('data', (data: Buffer) => {
    console.error(`[FastAPI stderr]: ${data.toString().trim()}`);
  });

  pyProcess.on('exit', (code: number | null, signal: string | null) => {
    console.log(`[FastAPI] Exited with code ${code} and signal ${signal}`);
  });
};

/**
 * Polls the backend endpoint until it returns a 200 OK status code.
 */
const waitForBackend = (
  callback: () => void,
  retries = 50,
  interval = 500
): void => {
  if (retries === 0) {
    console.error('[Electron] Backend failed to start in time.');
    app.quit();
    return;
  }

  const req = http.get(`${SERVER_URL}/options`, (res) => {
    if (res.statusCode === 200) {
      console.log('[Electron] FastAPI server is ready!');
      callback();
    } else {
      setTimeout(() => waitForBackend(callback, retries - 1, interval), interval);
    }
  });

  req.on('error', () => {
    setTimeout(() => waitForBackend(callback, retries - 1, interval), interval);
  });

  req.end();
};

/**
 * Forcefully terminates the backend process to free up EDSDK/USB resources.
 */
const killBackend = (): void => {
  if (pyProcess && pyProcess.pid) {
    console.log('[Electron] Terminating backend process...');
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', pyProcess.pid.toString(), '/f', '/t']);
    } else {
      pyProcess.kill('SIGTERM');
    }
    pyProcess = null;
  }
};

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
    },
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  mainWindow.webContents.openDevTools();
}

// App Initialization
app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron');

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  // IPC Handlers
  ipcMain.on('ping', () => console.log('pong'));

  ipcMain.handle('store:get', (_, key) => {
    return store.get(key);
  });

  ipcMain.handle('store:set', (_, key, value) => {
    store.set(key, value);
  });

  ipcMain.handle('store:delete', (_, key) => {
    store.delete(key);
  });

  /**
   * Universal API Gateway Handler
   * Executes HTTP requests inside Node.js Main process to bypass Chromium CORS/file:// checks.
   */
  ipcMain.handle(
    'api:request',
    async (_, { endpoint, method = 'GET', body = null }: { endpoint: string; method?: string; body?: unknown }) => {
      try {
        const options: RequestInit = {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
        };

        if (body) {
          options.body = JSON.stringify(body);
        }

        const url = `${SERVER_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
        const response = await fetch(url, options);
        const data = await response.json();

        if (!response.ok) {
          return {
            status: 'error',
            statusCode: response.status,
            detail: data.detail || 'Request failed',
          };
        }

        return data;
      } catch (error) {
        console.error(`[IPC API Error] ${method} ${endpoint}:`, error);
        return {
          status: 'error',
          detail: error instanceof Error ? error.message : 'Unknown IPC Network Error',
        };
      }
    }
  );

  // Start backend & defer window creation until ready
  startBackend();
  waitForBackend(() => {
    createWindow();
  });

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Process Cleanup
app.on('window-all-closed', () => {
  killBackend();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  killBackend();
});