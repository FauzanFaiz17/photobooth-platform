import { create } from 'zustand'

import type { EventConfiguration } from '@/features/event/types'
import { mapFilterSnapshot, mapTemplateSnapshot } from '@/features/event/types'
import type { PhotoFilter } from '@/features/filter/types'
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
  shots: CapturedShot[]
  requiredShots: number
  remoteSessionId: number | null
  syncStatus: SessionSyncStatus
  syncError: string | null
  localDirectory: string | null
  uploadedShotCount: number
  composedImage: ComposedImage | null
  composedImageUploaded: boolean
  beginEvent: (configuration: EventConfiguration) => void
  setRemoteSession: (sessionId: number | null) => void
  setSyncStatus: (status: SessionSyncStatus, error?: string | null) => void
  setLocalDirectory: (directory: string) => void
  setUploadedShotCount: (count: number) => void
  setComposedImage: (image: ComposedImage | null) => void
  setComposedImageUploaded: (uploaded: boolean) => void
  setTemplate: (template: PhotoTemplate) => void
  setFilter: (filter: PhotoFilter | null) => void
  addShot: (shot: CapturedShot) => void
  resetShots: () => void
  reset: () => void
}

const DEFAULT_REQUIRED_SHOTS = 4

export const useSessionStore = create<SessionState>((set) => ({
  eventConfiguration: null,
  template: null,
  filter: null,
  shots: [],
  requiredShots: DEFAULT_REQUIRED_SHOTS,
  remoteSessionId: null,
  syncStatus: 'idle',
  syncError: null,
  localDirectory: null,
  uploadedShotCount: 0,
  composedImage: null,
  composedImageUploaded: false,

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
      shots: [],
      requiredShots,
      remoteSessionId: null,
      syncStatus: 'creating',
      syncError: null,
      localDirectory: null,
      uploadedShotCount: 0,
      composedImage: null,
      composedImageUploaded: false
    })
  },

  setRemoteSession: (remoteSessionId) => set({ remoteSessionId }),

  setSyncStatus: (syncStatus, syncError = null) => set({ syncStatus, syncError }),

  setLocalDirectory: (localDirectory) => set({ localDirectory }),

  setUploadedShotCount: (uploadedShotCount) => set({ uploadedShotCount }),

  setComposedImage: (composedImage) => set({ composedImage, composedImageUploaded: false }),

  setComposedImageUploaded: (composedImageUploaded) => set({ composedImageUploaded }),

  setTemplate: (template) =>
    set({
      template,
      requiredShots: template.slots ?? DEFAULT_REQUIRED_SHOTS
    }),

  setFilter: (filter) => set({ filter }),

  addShot: (shot) =>
    set((state) => ({
      shots: [...state.shots, shot]
    })),

  resetShots: () =>
    set({
      shots: [],
      composedImage: null,
      composedImageUploaded: false,
      uploadedShotCount: 0
    }),

  reset: () =>
    set({
      eventConfiguration: null,
      template: null,
      filter: null,
      shots: [],
      requiredShots: DEFAULT_REQUIRED_SHOTS,
      remoteSessionId: null,
      syncStatus: 'idle',
      syncError: null,
      localDirectory: null,
      uploadedShotCount: 0,
      composedImage: null,
      composedImageUploaded: false
    })
}))
