import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

export interface DeviceFingerprint {
  deviceUuid: string

  windowsUuid: string

  cpuIdentifier: string

  macAddress: string

  appVersion: string
}

// Gabungkan electronAPI bawaan @electron-toolkit/preload dengan
// custom device bridge, supaya hanya satu kali expose untuk key "electron".
const electron = {
  ...electronAPI,
  device: {
    getFingerprint: (): Promise<DeviceFingerprint> => ipcRenderer.invoke('device:fingerprint')
  }
}

declare global {
  interface Window {
    electron: typeof electronAPI & {
      device: {
        getFingerprint(): Promise<DeviceFingerprint>
      }
    }
  }
}

// Custom APIs for renderer
const api = {
  request: (endpoint: string, method = 'GET', body?: unknown) =>
    ipcRenderer.invoke('api:request', { endpoint, method, body })
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electron)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electron
  // @ts-ignore (define in dts)
  window.api = api
}

contextBridge.exposeInMainWorld('session', {
  saveWebcamShots: (shots: string[], finalImage?: string): Promise<{ directory: string }> =>
    ipcRenderer.invoke('session:save-webcam-shots', shots, finalImage)
})
contextBridge.exposeInMainWorld('asset', {
  loadImage: (url: string): Promise<string> => ipcRenderer.invoke('asset:load-image', url)
})
contextBridge.exposeInMainWorld('storage', {
  get: (key: string) => ipcRenderer.invoke('store:get', key),

  set: (key: string, value: unknown) => ipcRenderer.invoke('store:set', key, value),

  delete: (key: string) => ipcRenderer.invoke('store:delete', key)
})
