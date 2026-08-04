/// <reference types="vite/client" />

export {}

declare global {
  interface Window {
    api?: {
      request: (endpoint: string, method?: string, body?: unknown) => Promise<any>
    }
  }
}