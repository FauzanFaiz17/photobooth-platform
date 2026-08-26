import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join, dirname } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { spawn, ChildProcess } from 'node:child_process'
import http from 'node:http'
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import Store from 'electron-store'
import icon from '../../resources/icon.png?asset'
import { registerDeviceIpc } from './ipc/device'

const store = new Store()

let pyProcess: ChildProcess | null = null
const PORT = 5000
const SERVER_URL = `http://127.0.0.1:${PORT}`
const MAX_TEMPLATE_ASSET_BYTES = 30 * 1024 * 1024
const remoteApiUrl = import.meta.env.MAIN_VITE_API_URL as string | undefined
const allowedAssetOrigins = new Set(
  [remoteApiUrl]
    .filter((value): value is string => Boolean(value))
    .map((value) => new URL(value).origin)
)

/**
 * Spawns the PyInstaller executable as a child process.
 */
const startBackend = (): void => {
  const exePath = app.isPackaged
    ? join(process.resourcesPath, 'bin', 'main.exe')
    : join(__dirname, '../../cameraAPI/main.exe')

  console.log(`[Electron] Spawning backend binary at: ${exePath}`)

  pyProcess = spawn(exePath, [], {
    cwd: dirname(exePath),
    detached: false
  })

  pyProcess.stdout?.on('data', (data: Buffer) => {
    console.log(`[FastAPI stdout]: ${data.toString().trim()}`)
  })

  pyProcess.stderr?.on('data', (data: Buffer) => {
    console.error(`[FastAPI stderr]: ${data.toString().trim()}`)
  })

  pyProcess.on('error', (error) => {
    console.error('[FastAPI] Failed to start camera service:', error)
  })

  pyProcess.on('exit', (code: number | null, signal: string | null) => {
    console.log(`[FastAPI] Exited with code ${code} and signal ${signal}`)
  })
}

/**
 * Polls the backend endpoint until it returns a 200 OK status code.
 */
const waitForBackend = (callback: () => void, retries = 50, interval = 500): void => {
  if (retries === 0) {
    console.error(
      '[Electron] Camera service failed to start. Continuing with renderer webcam support.'
    )
    callback()
    return
  }

  const req = http.get(`${SERVER_URL}/options`, (res) => {
    if (res.statusCode === 200) {
      console.log('[Electron] FastAPI server is ready!')
      callback()
    } else {
      setTimeout(() => waitForBackend(callback, retries - 1, interval), interval)
    }
  })

  req.on('error', () => {
    setTimeout(() => waitForBackend(callback, retries - 1, interval), interval)
  })

  req.end()
}

/**
 * Forcefully terminates the backend process to free up EDSDK/USB resources.
 */
const killBackend = (): void => {
  if (pyProcess && pyProcess.pid) {
    console.log('[Electron] Terminating backend process...')
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', pyProcess.pid.toString(), '/f', '/t'])
    } else {
      pyProcess.kill('SIGTERM')
    }
    pyProcess = null
  }
}

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    frame: false,
    fullscreen: true,
    kiosk: true,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  if (is.dev) {
    mainWindow.webContents.openDevTools()
  }
}

// App Initialization
app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC Handlers
  ipcMain.on('ping', () => console.log('pong'))
  ipcMain.handle('window:minimize', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    if (!window) return
    window.setKiosk(false)
    window.minimize()
    window.once('restore', () => window.setKiosk(true))
  })
  ipcMain.handle('window:close', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.close()
  })
  ipcMain.handle('home:pick-image', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp'] }]
    })
    if (result.canceled || !result.filePaths[0]) return null
    const source = result.filePaths[0]
    const extension = source.split('.').pop()?.toLowerCase() ?? 'png'
    const bytes = await readFile(source)
    return `data:image/${extension === 'jpg' ? 'jpeg' : extension};base64,${bytes.toString('base64')}`
  })

  ipcMain.handle('store:get', (_, key) => {
    return store.get(key)
  })

  ipcMain.handle('store:set', (_, key, value) => {
    store.set(key, value)
  })

  ipcMain.handle('store:delete', (_, key) => {
    store.delete(key)
  })

  ipcMain.handle(
    'session:save-webcam-shots',
    async (_, shots: string[], finalImage?: string, gifImage?: string) => {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const directory = join(app.getPath('pictures'), 'Photobooth', timestamp)

      await mkdir(directory, { recursive: true })

      await Promise.all(
        shots.map((dataUrl, index) => {
          const base64 = dataUrl.replace(/^data:image\/(png|jpeg);base64,/, '')
          return writeFile(
            join(directory, `capture-${String(index + 1).padStart(2, '0')}.png`),
            Buffer.from(base64, 'base64')
          )
        })
      )

      if (finalImage) {
        const base64 = finalImage.replace(/^data:image\/(png|jpeg);base64,/, '')
        await writeFile(join(directory, 'final-composite.png'), Buffer.from(base64, 'base64'))
      }

      if (gifImage) {
        const base64 = gifImage.replace(/^data:image\/gif;base64,/, '')
        await writeFile(join(directory, 'session-animation.gif'), Buffer.from(base64, 'base64'))
      }

      return { directory }
    }
  )

  ipcMain.handle('asset:load-image', async (_, source: string) => {
    const url = new URL(source)

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new Error('Protokol asset template tidak didukung.')
    }

    if (!allowedAssetOrigins.has(url.origin)) {
      throw new Error('Origin asset template tidak diizinkan.')
    }

    const response = await fetch(url, { redirect: 'error' })

    if (!response.ok) {
      throw new Error(`Asset template gagal dimuat (${response.status}).`)
    }

    const mimeType = response.headers.get('content-type')?.split(';')[0] ?? ''

    if (!mimeType.startsWith('image/')) {
      throw new Error('Asset template bukan file gambar.')
    }

    const declaredSize = Number(response.headers.get('content-length') ?? 0)

    if (declaredSize > MAX_TEMPLATE_ASSET_BYTES) {
      throw new Error('Asset template melebihi batas 30 MB.')
    }

    const bytes = Buffer.from(await response.arrayBuffer())

    if (bytes.byteLength > MAX_TEMPLATE_ASSET_BYTES) {
      throw new Error('Asset template melebihi batas 30 MB.')
    }

    return `data:${mimeType};base64,${bytes.toString('base64')}`
  })
  // Didaftarkan sekali saja saat app siap, bukan di dalam
  // waitForBackend() yang bisa dipanggil berulang kali (retry loop).
  registerDeviceIpc()

  /**
   * Universal API Gateway Handler
   * Executes HTTP requests inside Node.js Main process to bypass Chromium CORS/file:// checks.
   */
  ipcMain.handle(
    'api:request',
    async (
      _,
      {
        endpoint,
        method = 'GET',
        body = null
      }: { endpoint: string; method?: string; body?: unknown }
    ) => {
      try {
        const options: RequestInit = {
          method,
          headers: {
            'Content-Type': 'application/json'
          }
        }

        if (body) {
          options.body = JSON.stringify(body)
        }

        const url = `${SERVER_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`
        const response = await fetch(url, options)
        const data = await response.json()

        if (!response.ok) {
          return {
            status: 'error',
            statusCode: response.status,
            detail: data.detail || 'Request failed'
          }
        }

        return data
      } catch (error) {
        console.error(`[IPC API Error] ${method} ${endpoint}:`, error)
        return {
          status: 'error',
          detail: error instanceof Error ? error.message : 'Unknown IPC Network Error'
        }
      }
    }
  )

  // Start backend & defer window creation until ready
  startBackend()
  waitForBackend(() => {
    createWindow()
  })

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Process Cleanup
app.on('window-all-closed', () => {
  killBackend()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('will-quit', () => {
  killBackend()
})
