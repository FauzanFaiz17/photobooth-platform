import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join, dirname } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { spawn, ChildProcess } from 'node:child_process'
import http from 'node:http'
import { mkdir, writeFile, readFile, readdir, stat, rename } from 'node:fs/promises'
import Store from 'electron-store'
import icon from '../../resources/icon.png?asset'
import { registerDeviceIpc } from './ipc/device'

const store = new Store()

let pyProcess: ChildProcess | null = null
const PORT = 5000
const SERVER_URL = `http://127.0.0.1:${PORT}`

/** Direktori aktif yang diberitahukan ke cameraAPI via /set_save_dir. */
let cameraSaveDir: string | null = null

async function cameraServiceRequest(
  endpoint: string,
  method = 'GET',
  body?: unknown
): Promise<unknown> {
  const response = await fetch(`${SERVER_URL}${endpoint}`, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body)
  })
  return (await response.json()) as unknown
}

/** Mencari file capture JPEG terbaru yang muncul di directory setelah sinceMs. */
async function waitForNewestCapture(directory: string, sinceMs: number): Promise<string | null> {
  const deadline = Date.now() + 8000

  while (Date.now() < deadline) {
    try {
      const entries = await readdir(directory)
      const candidates = entries.filter((name) => /^capture_.+\.jpe?g$/i.test(name))
      let newestPath: string | null = null
      let newestTime = sinceMs

      for (const name of candidates) {
        const fullPath = join(directory, name)
        const info = await stat(fullPath).catch(() => null)
        if (info && info.mtimeMs > newestTime) {
          newestTime = info.mtimeMs
          newestPath = fullPath
        }
      }

      if (newestPath) return newestPath
    } catch {
      // Direktori mungkin belum siap; coba lagi sampai deadline.
    }

    await new Promise((resolve) => setTimeout(resolve, 250))
  }

  return null
}
const MAX_TEMPLATE_ASSET_BYTES = 30 * 1024 * 1024
const remoteApiUrl = import.meta.env.MAIN_VITE_API_URL as string | undefined
const rendererApiUrl = (import.meta.env as unknown as Record<string, string | undefined>)
  .VITE_API_URL
const allowedAssetOrigins = new Set(
  [remoteApiUrl, rendererApiUrl]
    .filter((value): value is string => Boolean(value))
    .map((value) => new URL(value).origin)
)

interface PrintImageOptions {
  dataUrl: string
  deviceName: string
  copies: number
  paperSize: '2r' | '4r'
  orientation: string
}

function paperDimensions(paperSize: '2r' | '4r'): { width: number; height: number } {
  return paperSize === '2r' ? { width: 60000, height: 90000 } : { width: 100000, height: 150000 }
}

async function printDataUrl(options: PrintImageOptions): Promise<void> {
  if (!options.dataUrl.startsWith('data:image/')) {
    throw new Error('Data gambar print tidak valid.')
  }

  const printWindow = new BrowserWindow({
    show: false,
    webPreferences: { sandbox: true }
  })
  const dimensions = paperDimensions(options.paperSize)
  const landscape = options.orientation.toLowerCase() === 'landscape'
  // Printer foto (mis. DNP RX1HS) punya media fisik portrait; flag
  // `landscape: true` Chromium menimbulkan rotasi ganda sehingga hasil
  // menjadi portrait terpotong dengan pinggir kosong. Solusinya: halaman
  // selalu portrait sesuai media, dan gambar landscape dirotasi 90 derajat
  // lewat CSS agar memenuhi lebar kertas.
  const width = dimensions.width
  const height = dimensions.height
  const pageWidthMm = (width / 1000).toFixed(1)
  const pageHeightMm = (height / 1000).toFixed(1)
  const imgStyle = landscape
    ? `position:absolute;top:50%;left:50%;width:${pageHeightMm}mm;height:${pageWidthMm}mm;object-fit:fill;transform:translate(-50%,-50%) rotate(90deg)`
    : 'position:absolute;top:0;left:0;width:100%;height:100%;object-fit:fill'
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>@page{margin:0;size:${pageWidthMm}mm ${pageHeightMm}mm}html,body{margin:0;width:${pageWidthMm}mm;height:${pageHeightMm}mm;overflow:hidden;position:relative}img{display:block;${imgStyle}}</style></head><body><img src="${options.dataUrl}" /></body></html>`

  try {
    await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
    await new Promise<void>((resolve, reject) => {
      printWindow.webContents.print(
        {
          silent: true,
          printBackground: true,
          deviceName: options.deviceName,
          copies: Math.max(1, Math.min(20, Math.trunc(options.copies))),
          landscape: false,
          margins: { marginType: 'none' },
          pageSize: { width, height }
        },
        (success, failureReason) => {
          if (success) resolve()
          else reject(new Error(failureReason || 'Driver printer menolak job print.'))
        }
      )
    })
  } finally {
    if (!printWindow.isDestroyed()) printWindow.destroy()
  }
}

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
    kiosk: !is.dev,
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
  ipcMain.handle('storage:pick-directory', async () => {
    const window = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
    const result = await dialog.showOpenDialog(window, {
      properties: ['openDirectory', 'createDirectory'],
      title: 'Pilih Folder Penyimpanan Foto'
    })
    return result.canceled ? null : (result.filePaths[0] ?? null)
  })
  ipcMain.handle('camera:capture-preview', async () => {
    await fetch(`${SERVER_URL}/capture`, { method: 'POST' })
    const response = await fetch(`${SERVER_URL}/video_feed`)
    if (!response.ok || !response.body) throw new Error('Preview Canon tidak tersedia.')

    const reader = response.body.getReader()
    let bytes = Buffer.alloc(0)
    const deadline = Date.now() + 5000

    try {
      while (Date.now() < deadline) {
        const { value, done } = await reader.read()
        if (done) break
        bytes = Buffer.concat([bytes, Buffer.from(value)])
        const start = bytes.indexOf(Buffer.from([0xff, 0xd8]))
        const end = start >= 0 ? bytes.indexOf(Buffer.from([0xff, 0xd9]), start + 2) : -1
        if (start >= 0 && end > start) {
          return `data:image/jpeg;base64,${bytes.subarray(start, end + 2).toString('base64')}`
        }
        if (bytes.length > 10 * 1024 * 1024) bytes = bytes.subarray(-2 * 1024 * 1024)
      }
    } finally {
      await reader.cancel()
    }

    throw new Error('Frame Canon tidak diterima dalam 5 detik.')
  })
  ipcMain.handle('camera:set-save-dir', async (_, directory: string) => {
    if (!directory || typeof directory !== 'string')
      throw new Error('Direktori kamera tidak valid.')

    await mkdir(directory, { recursive: true })
    await cameraServiceRequest('/set_save_dir', 'POST', { path: directory })
    cameraSaveDir = directory
    return { directory }
  })
  ipcMain.handle(
    'camera:capture-canon',
    async (
      _,
      options?: { filename?: string }
    ): Promise<{ dataUrl: string; filePath: string | null }> => {
      const startedAt = Date.now()
      await cameraServiceRequest('/capture', 'POST')

      if (!cameraSaveDir) {
        throw new Error('Direktori penyimpanan kamera belum diatur.')
      }

      const capturedPath = await waitForNewestCapture(cameraSaveDir, startedAt)
      if (!capturedPath) {
        throw new Error('File hasil capture Canon tidak ditemukan dalam 8 detik.')
      }

      let finalPath = capturedPath
      if (options?.filename) {
        const renamedPath = join(cameraSaveDir, options.filename)
        await rename(capturedPath, renamedPath).catch(() => undefined)
        finalPath = renamedPath
      }

      const bytes = await readFile(finalPath)
      return {
        dataUrl: `data:image/jpeg;base64,${bytes.toString('base64')}`,
        filePath: finalPath
      }
    }
  )
  ipcMain.handle(
    'session:prepare-directory',
    async (_, baseDirectory?: string | null, subdirectory?: string | null) => {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const base = baseDirectory || join(app.getPath('pictures'), 'Photobooth')
      const directory = join(base, subdirectory || timestamp)
      await mkdir(directory, { recursive: true })
      return { directory }
    }
  )
  ipcMain.handle('printer:list', async (event) => {
    const printers = await event.sender.getPrintersAsync()
    return printers.map((printer) => ({
      name: printer.name,
      displayName: printer.displayName || printer.name,
      isDefault: false
    }))
  })
  ipcMain.handle('printer:print-image', async (_, options: PrintImageOptions) => {
    await printDataUrl(options)
  })
  ipcMain.handle('printer:pick-sample-image', async () => {
    const window = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
    const result = await dialog.showOpenDialog(window, {
      title: 'Pilih Foto Sample Test Print',
      properties: ['openFile'],
      filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp'] }]
    })
    if (result.canceled || !result.filePaths[0]) return null
    const source = result.filePaths[0]
    const extension = source.split('.').pop()?.toLowerCase() ?? 'png'
    const bytes = await readFile(source)
    return {
      name: source.split(/[\\/]/).pop() ?? source,
      dataUrl: `data:image/${extension === 'jpg' ? 'jpeg' : extension};base64,${bytes.toString('base64')}`
    }
  })
  ipcMain.handle(
    'printer:test',
    async (
      _,
      deviceName: string,
      options?: {
        paperSize?: '2r' | '4r'
        copies?: number
        sampleDataUrl?: string
        orientation?: 'portrait' | 'landscape'
      }
    ) => {
      const testImage =
        options?.sampleDataUrl ??
        `data:image/svg+xml;base64,${Buffer.from(
          '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1800"><rect width="1200" height="1800" fill="white"/><rect x="36" y="36" width="1128" height="1728" fill="none" stroke="black" stroke-width="12"/><text x="600" y="780" text-anchor="middle" font-family="Arial" font-size="84" font-weight="700">PHOTOBOOTH</text><text x="600" y="900" text-anchor="middle" font-family="Arial" font-size="48">DNP RX1HS TEST PRINT</text><text x="600" y="990" text-anchor="middle" font-family="Arial" font-size="32">Printer connection OK</text></svg>'
        ).toString('base64')}`
      await printDataUrl({
        dataUrl: testImage,
        deviceName,
        copies: options?.copies ?? 1,
        paperSize: options?.paperSize ?? '4r',
        orientation: options?.orientation ?? 'portrait'
      })
    }
  )

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
    async (
      _,
      shots: Array<string | { dataUrl: string; savedPath?: string | null }>,
      finalImage?: string,
      gifImage?: string,
      composedVideo?: string,
      storageDirectory?: string | null,
      options?: { exactDirectory?: boolean }
    ) => {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const baseDirectory = storageDirectory || join(app.getPath('pictures'), 'Photobooth')
      const directory = options?.exactDirectory ? baseDirectory : join(baseDirectory, timestamp)

      await mkdir(directory, { recursive: true })

      await Promise.all(
        shots.map(async (shot, index) => {
          const dataUrl = typeof shot === 'string' ? shot : shot.dataUrl
          const savedPath = typeof shot === 'string' ? null : (shot.savedPath ?? null)

          // Foto Canon asli sudah tersimpan sebagai JPEG oleh cameraAPI
          // di folder sesi; tidak perlu ditulis ulang sebagai PNG.
          if (savedPath) return

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

      if (composedVideo) {
        const base64 = composedVideo.replace(/^data:video\/[^;]+;base64,/, '')
        await writeFile(join(directory, 'template-video.webm'), Buffer.from(base64, 'base64'))
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
  fetch(`${SERVER_URL}/toggle_webcam`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ use_webcam: false, device_index: 0 })
  }).catch(() => undefined)
  killBackend()
})
