import type {
  GalleryMedia,
  GalleryMediaBase,
  GalleryUploadFormValues,
} from "../types/gallery.types"

export const createDummyGalleryMedia = (
  values: GalleryUploadFormValues,
  sequence: number
): GalleryMedia => {
  const base: Omit<GalleryMediaBase, "fileSizeBytes"> = {
    id: `media-upload-${sequence}`,
    fileName: values.fileName,
    sessionId: `SES-20260715-UP${sequence.toString().padStart(2, "0")}`,
    customerName: values.customerName,
    albumIds: [],
    createdAt: "2026-07-15T23:00:00+07:00",
    downloadCount: 0,
    publicationStatus: "private",
    downloadStatus: "not-downloaded",
    thumbnailPath: null,
  }

  switch (values.mediaType) {
    case "photo":
      return {
        ...base,
        type: "photo",
        fileSizeBytes: 4_500_000,
        width: 1920,
        height: 1080,
        format: "jpg",
      }
    case "gif":
      return {
        ...base,
        type: "gif",
        fileSizeBytes: 8_800_000,
        width: 1920,
        height: 1080,
        durationSeconds: 4,
        frameCount: 48,
        format: "gif",
      }
    case "video":
      return {
        ...base,
        type: "video",
        fileSizeBytes: 24_000_000,
        width: 1920,
        height: 1080,
        durationSeconds: 12,
        format: "mp4",
      }
  }
}
