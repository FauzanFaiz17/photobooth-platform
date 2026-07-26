import heroImage from "@/assets/hero.png"

import type {
  GalleryAlbum,
  GalleryFilters,
  GalleryMedia,
  GalleryStorageSummary,
  GallerySummary,
} from "../types/gallery.types"

export const defaultGalleryFilters = {
  query: "",
  mediaType: "all",
  publicationStatus: "all",
  downloadStatus: "all",
  albumId: "all",
  dateFrom: null,
  dateTo: null,
  sort: "newest",
} satisfies GalleryFilters

export const gallerySummary = {
  totalMedia: 1_248,
  totalSessions: 312,
  publishedAlbums: 18,
  storageUsedGb: 174,
  storageTotalGb: 256,
} satisfies GallerySummary

const GIGABYTE = 1_073_741_824

export const galleryStorage = {
  totalBytes: 256 * GIGABYTE,
  usedBytes: 174 * GIGABYTE,
  availableBytes: 82 * GIGABYTE,
  mediaCount: 1_248,
  largestMediaType: "video",
} satisfies GalleryStorageSummary

export const initialGalleryAlbums = [
  {
    id: "album-graduation-july",
    name: "Graduation July 2026",
    description: "Graduation sessions captured throughout July.",
    coverMediaId: "media-001",
    mediaIds: ["media-001", "media-002", "media-003", "media-013"],
    createdAt: "2026-07-01T09:00:00+07:00",
    status: "published",
    publicSlug: "graduation-july-2026",
  },
  {
    id: "album-birthday-events",
    name: "Birthday Events",
    description: "Birthday strips, GIFs, and celebration clips.",
    coverMediaId: "media-004",
    mediaIds: ["media-004", "media-005", "media-006", "media-014"],
    createdAt: "2026-06-18T12:00:00+07:00",
    status: "published",
    publicSlug: "birthday-events",
  },
  {
    id: "album-wedding-collection",
    name: "Wedding Collection",
    description: "Private wedding portraits and slow-motion clips.",
    coverMediaId: "media-007",
    mediaIds: ["media-007", "media-008", "media-009", "media-015"],
    createdAt: "2026-06-09T10:30:00+07:00",
    status: "private",
    publicSlug: null,
  },
  {
    id: "album-uncategorized",
    name: "Uncategorized",
    description: "Media awaiting album assignment.",
    coverMediaId: null,
    mediaIds: ["media-010", "media-011", "media-012"],
    createdAt: "2026-05-01T08:00:00+07:00",
    status: "archived",
    publicSlug: null,
  },
] satisfies ReadonlyArray<GalleryAlbum>

export const initialGalleryMedia = [
  { id: "media-001", type: "photo", fileName: "graduation-session-001.jpg", sessionId: "SES-20260715-001", customerName: "Alya Putri", albumIds: ["album-graduation-july"], createdAt: "2026-07-15T21:42:00+07:00", fileSizeBytes: 4_820_000, downloadCount: 18, publicationStatus: "published", downloadStatus: "downloaded", thumbnailPath: heroImage, width: 2400, height: 3600, format: "jpg" },
  { id: "media-002", type: "photo", fileName: "graduation-session-002.webp", sessionId: "SES-20260715-001", customerName: "Alya Putri", albumIds: ["album-graduation-july"], createdAt: "2026-07-15T21:41:00+07:00", fileSizeBytes: 3_180_000, downloadCount: 12, publicationStatus: "published", downloadStatus: "downloaded", thumbnailPath: heroImage, width: 2400, height: 3600, format: "webp" },
  { id: "media-003", type: "gif", fileName: "graduation-boomerang-003.gif", sessionId: "SES-20260715-001", customerName: "Alya Putri", albumIds: ["album-graduation-july"], createdAt: "2026-07-15T21:40:00+07:00", fileSizeBytes: 8_650_000, downloadCount: 9, publicationStatus: "published", downloadStatus: "not-downloaded", thumbnailPath: heroImage, width: 1080, height: 1080, durationSeconds: 3.8, frameCount: 48, format: "gif" },
  { id: "media-004", type: "photo", fileName: "birthday-portrait-001.png", sessionId: "SES-20260715-002", customerName: "Nadya Sari", albumIds: ["album-birthday-events"], createdAt: "2026-07-15T19:12:00+07:00", fileSizeBytes: 5_940_000, downloadCount: 15, publicationStatus: "published", downloadStatus: "downloaded", thumbnailPath: heroImage, width: 3000, height: 2000, format: "png" },
  { id: "media-005", type: "gif", fileName: "birthday-boomerang-004.gif", sessionId: "SES-20260715-002", customerName: "Nadya Sari", albumIds: ["album-birthday-events"], createdAt: "2026-07-15T19:11:00+07:00", fileSizeBytes: 9_120_000, downloadCount: 21, publicationStatus: "published", downloadStatus: "downloaded", thumbnailPath: heroImage, width: 1080, height: 1080, durationSeconds: 4.2, frameCount: 52, format: "gif" },
  { id: "media-006", type: "video", fileName: "birthday-slowmotion-001.mp4", sessionId: "SES-20260715-002", customerName: "Nadya Sari", albumIds: ["album-birthday-events"], createdAt: "2026-07-15T19:10:00+07:00", fileSizeBytes: 28_400_000, downloadCount: 11, publicationStatus: "private", downloadStatus: "not-downloaded", thumbnailPath: heroImage, width: 1920, height: 1080, durationSeconds: 12.4, format: "mp4" },
  { id: "media-007", type: "photo", fileName: "wedding-portrait-007.jpeg", sessionId: "SES-20260714-008", customerName: "Raka & Naya", albumIds: ["album-wedding-collection"], createdAt: "2026-07-14T20:26:00+07:00", fileSizeBytes: 6_240_000, downloadCount: 7, publicationStatus: "private", downloadStatus: "downloaded", thumbnailPath: heroImage, width: 3600, height: 2400, format: "jpeg" },
  { id: "media-008", type: "video", fileName: "wedding-slowmotion-002.mp4", sessionId: "SES-20260714-008", customerName: "Raka & Naya", albumIds: ["album-wedding-collection"], createdAt: "2026-07-14T20:25:00+07:00", fileSizeBytes: 35_800_000, downloadCount: 14, publicationStatus: "private", downloadStatus: "not-downloaded", thumbnailPath: heroImage, width: 1920, height: 1080, durationSeconds: 16.8, format: "mp4" },
  { id: "media-009", type: "gif", fileName: "wedding-loop-003.gif", sessionId: "SES-20260714-008", customerName: "Raka & Naya", albumIds: ["album-wedding-collection"], createdAt: "2026-07-14T20:24:00+07:00", fileSizeBytes: 10_250_000, downloadCount: 6, publicationStatus: "private", downloadStatus: "not-downloaded", thumbnailPath: null, width: 1080, height: 1080, durationSeconds: 5.1, frameCount: 64, format: "gif" },
  { id: "media-010", type: "photo", fileName: "studio-guest-010.jpg", sessionId: "SES-20260713-015", customerName: "Guest 015", albumIds: ["album-uncategorized"], createdAt: "2026-07-13T18:05:00+07:00", fileSizeBytes: 4_190_000, downloadCount: 0, publicationStatus: "archived", downloadStatus: "not-downloaded", thumbnailPath: null, width: 2400, height: 3600, format: "jpg" },
  { id: "media-011", type: "photo", fileName: "family-strip-011.jpg", sessionId: "SES-20260712-021", customerName: "Keluarga Ardi", albumIds: ["album-uncategorized"], createdAt: "2026-07-12T16:34:00+07:00", fileSizeBytes: 4_760_000, downloadCount: 3, publicationStatus: "archived", downloadStatus: "downloaded", thumbnailPath: heroImage, width: 1800, height: 5400, format: "jpg" },
  { id: "media-012", type: "video", fileName: "studio-highlight-012.webm", sessionId: "SES-20260711-006", customerName: "Dimas Ardi", albumIds: ["album-uncategorized"], createdAt: "2026-07-11T14:18:00+07:00", fileSizeBytes: 22_700_000, downloadCount: 2, publicationStatus: "archived", downloadStatus: "not-downloaded", thumbnailPath: null, width: 1280, height: 720, durationSeconds: 9.6, format: "webm" },
  { id: "media-013", type: "photo", fileName: "graduation-group-013.jpg", sessionId: "SES-20260710-012", customerName: "Class of 2026", albumIds: ["album-graduation-july"], createdAt: "2026-07-10T17:22:00+07:00", fileSizeBytes: 7_480_000, downloadCount: 26, publicationStatus: "published", downloadStatus: "downloaded", thumbnailPath: heroImage, width: 4200, height: 2800, format: "jpg" },
  { id: "media-014", type: "gif", fileName: "birthday-confetti-014.gif", sessionId: "SES-20260709-004", customerName: "Keisha", albumIds: ["album-birthday-events"], createdAt: "2026-07-09T13:40:00+07:00", fileSizeBytes: 11_380_000, downloadCount: 19, publicationStatus: "published", downloadStatus: "downloaded", thumbnailPath: heroImage, width: 1080, height: 1080, durationSeconds: 4.8, frameCount: 60, format: "gif" },
  { id: "media-015", type: "video", fileName: "wedding-entrance-015.mp4", sessionId: "SES-20260708-009", customerName: "Fajar & Intan", albumIds: ["album-wedding-collection"], createdAt: "2026-07-08T19:55:00+07:00", fileSizeBytes: 42_600_000, downloadCount: 8, publicationStatus: "private", downloadStatus: "not-downloaded", thumbnailPath: heroImage, width: 1920, height: 1080, durationSeconds: 18.2, format: "mp4" },
] satisfies ReadonlyArray<GalleryMedia>
