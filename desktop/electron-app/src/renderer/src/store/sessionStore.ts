import { create } from 'zustand'

import type { EventConfiguration, EventPrintOption } from '@/features/event/types'
import { mapFilterSnapshot, mapTemplateSnapshot } from '@/features/event/types'
import type { PhotoFilter } from '@/features/filter/types'
import type { AnimatedGif } from '@/features/gif/services/createSessionGif'
import type { ComposedImage } from '@/features/template/services/composeTemplate'
import type { PhotoTemplate } from '@/features/template/types'

export interface CapturedShot {
  id: string
  dataUrl: string
  width?: number
  height?: number
}

export type SessionSyncStatus =
  'idle' | 'creating' | 'ready' | 'syncing' | 'synced' | 'local-only' | 'failed'

interface SessionState {
  eventConfiguration: EventConfiguration | null
  template: PhotoTemplate | null
  filter: PhotoFilter | null
  paperSize: '2r' | '4r' | null
  printOption: EventPrintOption | null
  quantity: number
  paymentId: number | null
  customerId: number | null
  shots: CapturedShot[]
  requiredShots: number
  remoteSessionId: number | null
  syncStatus: SessionSyncStatus
  syncError: string | null
  localDirectory: string | null
  uploadedShotCount: number
  composedImage: ComposedImage | null
  composedImageUploaded: boolean
  animatedGif: AnimatedGif | null
  animatedGifUploaded: boolean
  beginEvent: (configuration: EventConfiguration) => void
  setRemoteSession: (sessionId: number | null) => void
  setSyncStatus: (status: SessionSyncStatus, error?: string | null) => void
  setLocalDirectory: (directory: string) => void
  setUploadedShotCount: (count: number) => void
  setComposedImage: (image: ComposedImage | null) => void
  setComposedImageUploaded: (uploaded: boolean) => void
  setAnimatedGif: (gif: AnimatedGif | null) => void
  setAnimatedGifUploaded: (uploaded: boolean) => void
  setTemplate: (template: PhotoTemplate) => void
  setFilter: (filter: PhotoFilter | null) => void
  setPaperSize: (paperSize: '2r' | '4r') => void
  setPrintSelection: (option: EventPrintOption, quantity: number) => void
  setPaymentId: (paymentId: number) => void
  setCustomerId: (customerId: number | null) => void
  addShot: (shot: CapturedShot) => void
  resetShots: () => void
  resetTransaction: () => void
  reset: () => void
}

const DEFAULT_REQUIRED_SHOTS = 4

export const useSessionStore = create<SessionState>((set) => ({
  eventConfiguration: null,
  template: null,
  filter: null,
  paperSize: null,
  printOption: null,
  quantity: 0,
  paymentId: null,
  customerId: null,
  shots: [],
  requiredShots: DEFAULT_REQUIRED_SHOTS,
  remoteSessionId: null,
  syncStatus: 'idle',
  syncError: null,
  localDirectory: null,
  uploadedShotCount: 0,
  composedImage: null,
  composedImageUploaded: false,
  animatedGif: null,
  animatedGifUploaded: false,

  beginEvent: (configuration) => {
    const mappedTemplate = mapTemplateSnapshot(configuration.template)
    const filter = mapFilterSnapshot(configuration.filter)
    const frames = configuration.template.json_layout.frames
    const requiredShots =
      Array.isArray(frames) && frames.length > 0
        ? frames.length
        : Math.max(1, configuration.camera.burst_count)
    const template = {
      ...mappedTemplate,
      slots: requiredShots
    }

    set({
      eventConfiguration: configuration,
      template,
      filter,
      paperSize: configuration.template.paper_size ?? '2r',
      printOption: configuration.print_options?.find((item) => item.is_active) ?? null,
      quantity: configuration.print_options?.find((item) => item.is_active)?.unit_quantity ?? 0,
      paymentId: null,
      customerId: null,
      shots: [],
      requiredShots,
      remoteSessionId: null,
      syncStatus: 'creating',
      syncError: null,
      localDirectory: null,
      uploadedShotCount: 0,
      composedImage: null,
      composedImageUploaded: false,
      animatedGif: null,
      animatedGifUploaded: false
    })
  },

  setRemoteSession: (remoteSessionId) => set({ remoteSessionId }),

  setSyncStatus: (syncStatus, syncError = null) => set({ syncStatus, syncError }),

  setLocalDirectory: (localDirectory) => set({ localDirectory }),

  setUploadedShotCount: (uploadedShotCount) => set({ uploadedShotCount }),

  setComposedImage: (composedImage) => set({ composedImage, composedImageUploaded: false }),

  setComposedImageUploaded: (composedImageUploaded) => set({ composedImageUploaded }),

  setAnimatedGif: (animatedGif) => set({ animatedGif, animatedGifUploaded: false }),

  setAnimatedGifUploaded: (animatedGifUploaded) => set({ animatedGifUploaded }),

  setTemplate: (template) =>
    set({
      template,
      requiredShots: template.slots ?? DEFAULT_REQUIRED_SHOTS
    }),

  setFilter: (filter) => set({ filter }),
  setPaperSize: (paperSize) => set({ paperSize, template: null, printOption: null, quantity: 0 }),
  setPrintSelection: (printOption, quantity) => set({ printOption, quantity }),
  setPaymentId: (paymentId) => set({ paymentId }),
  setCustomerId: (customerId) => set({ customerId }),

  addShot: (shot) =>
    set((state) => ({
      shots: [...state.shots, shot]
    })),

  resetShots: () =>
    set({
      shots: [],
      composedImage: null,
      composedImageUploaded: false,
      animatedGif: null,
      animatedGifUploaded: false,
      uploadedShotCount: 0
    }),

  resetTransaction: () =>
    set((state) => ({
      eventConfiguration: state.eventConfiguration,
      template: null,
      filter: null,
      paperSize: null,
      printOption: null,
      quantity: 0,
      paymentId: null,
      customerId: null,
      shots: [],
      requiredShots: DEFAULT_REQUIRED_SHOTS,
      remoteSessionId: null,
      syncStatus: 'idle',
      syncError: null,
      localDirectory: null,
      uploadedShotCount: 0,
      composedImage: null,
      composedImageUploaded: false,
      animatedGif: null,
      animatedGifUploaded: false
    })),

  reset: () =>
    set({
      eventConfiguration: null,
      template: null,
      filter: null,
      paperSize: null,
      printOption: null,
      quantity: 0,
      paymentId: null,
      customerId: null,
      shots: [],
      requiredShots: DEFAULT_REQUIRED_SHOTS,
      remoteSessionId: null,
      syncStatus: 'idle',
      syncError: null,
      localDirectory: null,
      uploadedShotCount: 0,
      composedImage: null,
      composedImageUploaded: false,
      animatedGif: null,
      animatedGifUploaded: false
    })
}))
