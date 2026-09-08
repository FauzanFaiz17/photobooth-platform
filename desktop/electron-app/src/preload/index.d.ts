import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI & {
      device: {
        getFingerprint(): Promise<{
          deviceUuid: string
          windowsUuid: string
          cpuIdentifier: string
          macAddress: string
          appVersion: string
        }>
      }
      window: {
        minimize(): Promise<void>
        close(): Promise<void>
      }
      home: { pickImage(): Promise<string | null> }
      storage: { pickDirectory(): Promise<string | null> }
      camera: { capturePreview(): Promise<string> }
      printer: {
        list(): Promise<Array<{ name: string; displayName: string; isDefault: boolean }>>
        pickSampleImage(): Promise<{ name: string; dataUrl: string } | null>
        printImage(options: {
          dataUrl: string
          deviceName: string
          copies: number
          paperSize: '2r' | '4r'
          orientation: string
        }): Promise<void>
        test(deviceName: string, options?: { paperSize?: '2r' | '4r'; copies?: number; sampleDataUrl?: string }): Promise<void>
      }
    }
    api: unknown
  }
}

declare global {
  interface Window {
    asset: {
      loadImage(url: string): Promise<string>
    }
  }
}

export interface StorageAPI {
  get(key: string): Promise<unknown>
  set(key: string, value: unknown): Promise<void>
  delete(key: string): Promise<void>
}

declare global {
  interface Window {
    storage: StorageAPI
  }
}
declare global {
  interface Window {
    session: {
      saveWebcamShots(
        shots: string[],
        finalImage?: string,
        gifImage?: string,
        composedVideo?: string,
        storageDirectory?: string | null
      ): Promise<{ directory: string }>
    }
  }
}
