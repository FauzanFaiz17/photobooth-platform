import { create } from 'zustand'

import type { EventConfiguration, EventPrintOption } from '@/features/event/types'
import { mapFilterSnapshot, mapTemplateSnapshot } from '@/features/event/types'
import type { PhotoFilter } from '@/features/filter/types'
import type { AnimatedGif } from '@/features/gif/services/createSessionGif'
import type { ComposedImage } from '@/features/template/services/composeTemplate'
import type { ComposedVideo } from '@/features/template/services/composeTemplateVideo'
import type { PhotoTemplate } from '@/features/template/types'

export interface CapturedShot {
  id: string
  dataUrl: string
  width?: number
  height?: number
  /** Rekaman video pendek (webm data URL, tanpa audio) selama countdown shot ini. */
  videoDataUrl?: string
  mirror?: boolean
  /** JPEG asli dari kamera Canon (tanpa re-render canvas) untuk disimpan/diunggah. */
  originalDataUrl?: string
  originalWidth?: number
  originalHeight?: number
  /** Path file JPEG asli yang sudah tersimpan di folder sesi oleh cameraAPI. */
  savedPath?: string
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
  galleryUrl: string | null
  syncStatus: SessionSyncStatus
  syncError: string | null
  localDirectory: string | null
  /** Folder sesi yang sudah diarahkan ke cameraAPI via /set_save_dir (mode Canon). */
  cameraServiceDirectory: string | null
  uploadedShotCount: number
  uploadedVideoShotCount: number
  composedImage: ComposedImage | null
  composedImageUploaded: boolean
  printImage: ComposedImage | null
  printedLocally: boolean
  animatedGif: AnimatedGif | null
  animatedGifUploaded: boolean
  composedVideo: ComposedVideo | null
  composedVideoUploaded: boolean
  sessionDeadline: number | null
  beginEvent: (configuration: EventConfiguration) => void
  setRemoteSession: (sessionId: number | null) => void
  setGalleryUrl: (url: string | null) => void
  setSyncStatus: (status: SessionSyncStatus, error?: string | null) => void
  setLocalDirectory: (directory: string) => void
  setCameraServiceDirectory: (directory: string | null) => void
  setUploadedShotCount: (count: number) => void
  setUploadedVideoShotCount: (count: number) => void
  setComposedImage: (image: ComposedImage | null) => void
  setComposedImageUploaded: (uploaded: boolean) => void
  setPrintImage: (image: ComposedImage | null) => void
  setPrintedLocally: (printed: boolean) => void
  setAnimatedGif: (gif: AnimatedGif | null) => void
  setAnimatedGifUploaded: (uploaded: boolean) => void
  setComposedVideo: (video: ComposedVideo | null) => void
  setComposedVideoUploaded: (uploaded: boolean) => void
  setTemplate: (template: PhotoTemplate) => void
  setFilter: (filter: PhotoFilter | null) => void
  setPaperSize: (paperSize: '2r' | '4r') => void
  setPrintSelection: (option: EventPrintOption, quantity: number) => void
  setPaymentId: (paymentId: number) => void
  setCustomerId: (customerId: number | null) => void
  startSessionTimer: (minutes: number) => void
  stopSessionTimer: () => void
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
  galleryUrl: null,
  syncStatus: 'idle',
  syncError: null,
  localDirectory: null,
  cameraServiceDirectory: null,
  uploadedShotCount: 0,
  uploadedVideoShotCount: 0,
  composedImage: null,
  composedImageUploaded: false,
  printImage: null,
  printedLocally: false,
  animatedGif: null,
  animatedGifUploaded: false,
  composedVideo: null,
  composedVideoUploaded: false,
  sessionDeadline: null,

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
      galleryUrl: null,
      syncStatus: 'creating',
      syncError: null,
      localDirectory: null,
      cameraServiceDirectory: null,
      uploadedShotCount: 0,
      uploadedVideoShotCount: 0,
      composedImage: null,
      composedImageUploaded: false,
      printImage: null,
      printedLocally: false,
      animatedGif: null,
      animatedGifUploaded: false,
      composedVideo: null,
      composedVideoUploaded: false,
      sessionDeadline: null
    })
  },

  setRemoteSession: (remoteSessionId) => set({ remoteSessionId }),

  setGalleryUrl: (galleryUrl) => set({ galleryUrl }),

  setSyncStatus: (syncStatus, syncError = null) => set({ syncStatus, syncError }),

  setLocalDirectory: (localDirectory) => set({ localDirectory }),

  setCameraServiceDirectory: (cameraServiceDirectory) => set({ cameraServiceDirectory }),

  setUploadedShotCount: (uploadedShotCount) => set({ uploadedShotCount }),
  setUploadedVideoShotCount: (uploadedVideoShotCount) => set({ uploadedVideoShotCount }),

  setComposedImage: (composedImage) => set({ composedImage, composedImageUploaded: false }),

  setComposedImageUploaded: (composedImageUploaded) => set({ composedImageUploaded }),

  setPrintImage: (printImage) => set({ printImage }),

  setPrintedLocally: (printedLocally) => set({ printedLocally }),

  setAnimatedGif: (animatedGif) => set({ animatedGif, animatedGifUploaded: false }),

  setAnimatedGifUploaded: (animatedGifUploaded) => set({ animatedGifUploaded }),

  setComposedVideo: (composedVideo) => set({ composedVideo, composedVideoUploaded: false }),
  setComposedVideoUploaded: (composedVideoUploaded) => set({ composedVideoUploaded }),

  setTemplate: (template) =>
    set({
      template,
      requiredShots: template.slots ?? DEFAULT_REQUIRED_SHOTS
    }),

  setFilter: (filter) => set({ filter, printImage: null, printedLocally: false }),
  setPaperSize: (paperSize) => set({ paperSize, template: null, printOption: null, quantity: 0 }),
  setPrintSelection: (printOption, quantity) => set({ printOption, quantity }),
  setPaymentId: (paymentId) => set({ paymentId }),
  setCustomerId: (customerId) => set({ customerId }),
  startSessionTimer: (minutes) =>
    set((state) => ({
      sessionDeadline: state.sessionDeadline ?? Date.now() + Math.max(1, minutes) * 60_000
    })),
  stopSessionTimer: () => set({ sessionDeadline: null }),

  addShot: (shot) =>
    set((state) => ({
      shots: [...state.shots, shot]
    })),

  resetShots: () =>
    set({
      shots: [],
      composedImage: null,
      composedImageUploaded: false,
      printImage: null,
      printedLocally: false,
      animatedGif: null,
      animatedGifUploaded: false,
      composedVideo: null,
      uploadedShotCount: 0,
      uploadedVideoShotCount: 0
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
      galleryUrl: null,
      syncStatus: 'idle',
      syncError: null,
      localDirectory: null,
      cameraServiceDirectory: null,
      uploadedShotCount: 0,
      composedImage: null,
      composedImageUploaded: false,
      printImage: null,
      printedLocally: false,
      animatedGif: null,
      animatedGifUploaded: false,
      composedVideo: null,
      composedVideoUploaded: false,
      sessionDeadline: null
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
      galleryUrl: null,
      syncStatus: 'idle',
      syncError: null,
      localDirectory: null,
      cameraServiceDirectory: null,
      uploadedShotCount: 0,
      uploadedVideoShotCount: 0,
      composedImage: null,
      composedImageUploaded: false,
      printImage: null,
      printedLocally: false,
      animatedGif: null,
      animatedGifUploaded: false,
      composedVideo: null,
      composedVideoUploaded: false,
      sessionDeadline: null
    })
}))
