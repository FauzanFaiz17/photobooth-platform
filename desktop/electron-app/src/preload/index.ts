import { contextBridge, ipcRenderer  } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

contextBridge.exposeInMainWorld(

    "electron",

    {

        device: {

            getFingerprint: () =>

                ipcRenderer.invoke(

                    "device:fingerprint"

                )

        }

    }

);


export interface DeviceFingerprint {

    deviceUuid: string;

    windowsUuid: string;

    cpuIdentifier: string;

    macAddress: string;

    appVersion: string;

}

declare global {

    interface Window {

        electron: {

            device: {

                getFingerprint(): Promise<DeviceFingerprint>;

            };

        };

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
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}

contextBridge.exposeInMainWorld("storage", {
    get: (key: string) => ipcRenderer.invoke("store:get", key),

    set: (key: string, value: unknown) =>
        ipcRenderer.invoke("store:set", key, value),

    delete: (key: string) =>
        ipcRenderer.invoke("store:delete", key),
});
