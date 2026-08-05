import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: unknown
  }
}

export interface StorageAPI {
    get(key: string): Promise<unknown>;
    set(key: string, value: unknown): Promise<void>;
    delete(key: string): Promise<void>;
}

declare global {
    interface Window {
        storage: StorageAPI;
    }
}
declare global {
    interface Window {
        session: {
            saveWebcamShots(shots: string[]): Promise<{ directory: string }>;
        };
    }
}