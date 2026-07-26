import { useMemo, useRef, useState, type ReactElement } from "react"
import { toast } from "sonner"

import { Toaster } from "@/components/ui/sonner"
import { FramePhotoAssignmentDialog } from "../dialogs/frame-photo-assignment-dialog"
import { FramePhotoConfirmationDialog } from "../dialogs/frame-photo-confirmation-dialog"
import { FramePhotoFormDialog } from "../dialogs/frame-photo-form-dialog"
import { FramePhotoPreviewDialog } from "../dialogs/frame-photo-preview-dialog"
import { defaultPhotoFrameFilters, framePhotoKiosks, initialPhotoFrames, photoFrameSummary } from "../data/frame-photo-data"
import { FramePhotoBulkActions } from "../frames/frame-photo-bulk-actions"
import type { FramePhotoActions } from "../frames/frame-photo-actions"
import { FramePhotoGrid } from "../frames/frame-photo-grid"
import { FramePhotoList } from "../frames/frame-photo-list"
import { FramePhotoPagination } from "../frames/frame-photo-pagination"
import { FramePhotoHeader } from "../header/frame-photo-header"
import { FramePhotoEmptyState, FramePhotoSkeleton } from "../shared/frame-photo-states"
import { FramePhotoSummaryCards } from "../summary/frame-photo-summary-cards"
import { FramePhotoToolbar } from "../toolbar/frame-photo-toolbar"
import type { PhotoFrame, PhotoFrameConfirmationAction, PhotoFrameFilters, PhotoFrameFormValues, PhotoFramePaginationState, PhotoFrameSummary, PhotoFrameViewMode } from "../types/frame-photo.types"
import { duplicatePhotoFrame, importPhotoFrame, savePhotoFrame } from "../utils/frame-photo-state"
import { countActiveFrameFilters, filterPhotoFrames, sortPhotoFrames, validateFrameFile } from "../utils/frame-photo-utils"

interface ConfirmationState {
  readonly ids: ReadonlyArray<string>
  readonly action: PhotoFrameConfirmationAction
}

const initialActiveCount = initialPhotoFrames.filter((frame) => frame.status === "active").length
const initialDraftCount = initialPhotoFrames.filter((frame) => frame.status === "draft").length
const initialUsageCount = initialPhotoFrames.reduce((total, frame) => total + frame.usageCount, 0)

export function FramePhotoPageContent(): ReactElement {
  const [frames, setFrames] = useState<ReadonlyArray<PhotoFrame>>(initialPhotoFrames)
  const [filters, setFilters] = useState<PhotoFrameFilters>(defaultPhotoFrameFilters)
  const [view, setView] = useState<PhotoFrameViewMode>("grid")
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(() => new Set())
  const [pagination, setPagination] = useState<PhotoFramePaginationState>({ page: 1, pageSize: 12 })
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [assignmentIds, setAssignmentIds] = useState<ReadonlyArray<string>>([])
  const [confirmation, setConfirmation] = useState<ConfirmationState | null>(null)
  const sequence = useRef(initialPhotoFrames.length + 1)
  const isLoading = false

  const filteredFrames = useMemo(() => sortPhotoFrames(filterPhotoFrames(frames, filters), filters.sort), [frames, filters])
  const totalPages = Math.max(1, Math.ceil(filteredFrames.length / pagination.pageSize))
  const currentPagination = pagination.page > totalPages ? { ...pagination, page: totalPages } : pagination
  const pageStart = (currentPagination.page - 1) * currentPagination.pageSize
  const visibleFrames = filteredFrames.slice(pageStart, pageStart + currentPagination.pageSize)
  const visibleIds = visibleFrames.map((frame) => frame.id)
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id))
  const someVisibleSelected = !allVisibleSelected && visibleIds.some((id) => selectedIds.has(id))
  const previewFrame = frames.find((frame) => frame.id === previewId) ?? null
  const editFrame = frames.find((frame) => frame.id === editId) ?? null
  const assignmentFrames = frames.filter((frame) => assignmentIds.includes(frame.id))
  const confirmationFrames = frames.filter((frame) => confirmation?.ids.includes(frame.id) ?? false)

  const summary = useMemo<PhotoFrameSummary>(() => ({
    totalFrames: photoFrameSummary.totalFrames + frames.length - initialPhotoFrames.length,
    activeFrames: photoFrameSummary.activeFrames + frames.filter((frame) => frame.status === "active").length - initialActiveCount,
    draftFrames: photoFrameSummary.draftFrames + frames.filter((frame) => frame.status === "draft").length - initialDraftCount,
    totalUsage: photoFrameSummary.totalUsage + frames.reduce((total, frame) => total + frame.usageCount, 0) - initialUsageCount,
  }), [frames])

  const updateFilters = (next: PhotoFrameFilters): void => { setFilters(next); setPagination((current) => ({ ...current, page: 1 })) }
  const resetFilters = (): void => updateFilters(defaultPhotoFrameFilters)
  const toggleSelection = (id: string, selected: boolean): void => setSelectedIds((current) => { const next = new Set(current); if (selected) next.add(id); else next.delete(id); return next })
  const selectVisible = (selected: boolean): void => setSelectedIds((current) => { const next = new Set(current); for (const id of visibleIds) { if (selected) next.add(id); else next.delete(id) } return next })
  const updateStatus = (ids: ReadonlyArray<string>, status: PhotoFrame["status"]): void => { const targetIds = new Set(ids); setFrames((current) => current.map((frame) => targetIds.has(frame.id) ? { ...frame, status, updatedAt: "2026-07-15T23:30:00+07:00" } : frame)) }

  const actions: FramePhotoActions = {
    onPreview: (frame) => setPreviewId(frame.id),
    onEdit: (frame) => { setPreviewId(null); setEditId(frame.id) },
    onDuplicate: (frame) => { setPreviewId(null); setConfirmation({ ids: [frame.id], action: "duplicate" }) },
    onAssign: (frame) => setAssignmentIds([frame.id]),
    onActivate: (frame) => setConfirmation({ ids: [frame.id], action: "activate" }),
    onArchive: (frame) => setConfirmation({ ids: [frame.id], action: "archive" }),
    onDelete: (frame) => setConfirmation({ ids: [frame.id], action: "delete" }),
  }

  const handleSaveFrame = (values: PhotoFrameFormValues): void => {
    const saved = savePhotoFrame(values, editFrame, sequence.current)
    if (!editFrame) sequence.current += 1
    setFrames((current) => editFrame ? current.map((frame) => frame.id === editFrame.id ? saved : frame) : [saved, ...current])
    setEditId(null)
    setCreateOpen(false)
    toast.success(editFrame ? "Frame updated" : "Frame created", { description: `${saved.name} was saved locally.` })
  }

  const handleImport = (file: File): void => {
    const validation = validateFrameFile(file, "import")
    if (!validation.valid) { toast.error("Frame import failed", { description: validation.message }); return }
    const imported = importPhotoFrame(validation.asset, sequence.current)
    sequence.current += 1
    setFrames((current) => [imported, ...current])
    toast.success("Frame imported", { description: `${file.name} was added as a local draft.` })
  }

  const handleConfirmation = (): void => {
    if (!confirmation || confirmationFrames.length === 0) return
    if (confirmation.action === "duplicate") {
      const duplicate = duplicatePhotoFrame(confirmationFrames[0], sequence.current)
      sequence.current += 1
      setFrames((current) => [duplicate, ...current])
      toast.success("Frame duplicated", { description: `${duplicate.name} was created as a draft.` })
    } else if (confirmation.action === "activate") {
      updateStatus(confirmation.ids, "active")
      toast.success(`${confirmation.ids.length} frames activated`)
    } else if (confirmation.action === "archive") {
      updateStatus(confirmation.ids, "archived")
      toast.success(`${confirmation.ids.length} frames archived`)
    } else {
      const removing = new Set(confirmation.ids)
      setFrames((current) => current.filter((frame) => !removing.has(frame.id)))
      setSelectedIds((current) => new Set([...current].filter((id) => !removing.has(id))))
      toast.success(`${confirmation.ids.length} frames deleted`)
    }
    setConfirmation(null)
  }

  const handleAssignmentSave = (kioskIds: ReadonlyArray<string>): void => {
    const targets = new Set(assignmentIds)
    setFrames((current) => current.map((frame) => targets.has(frame.id) ? { ...frame, assignments: kioskIds.map((kioskId) => ({ kioskId })), updatedAt: "2026-07-15T23:30:00+07:00" } : frame))
    toast.success("Kiosk assignment saved", { description: `${assignmentIds.length} frames assigned to ${kioskIds.length} kiosks.` })
    setAssignmentIds([])
  }

  const initialAssignmentIds = assignmentFrames.length === 1 ? assignmentFrames[0].assignments.map((item) => item.kioskId) : []

  if (isLoading) return <FramePhotoSkeleton />

  return <div className="min-w-0 space-y-7 p-4 sm:p-6 lg:p-8"><FramePhotoHeader onImport={handleImport} onCreate={() => setCreateOpen(true)} /><FramePhotoSummaryCards summary={summary} /><FramePhotoToolbar filters={filters} view={view} visibleCount={filteredFrames.length} totalCount={frames.length} allVisibleSelected={allVisibleSelected} someVisibleSelected={someVisibleSelected} onFiltersChange={updateFilters} onViewChange={(nextView) => { setView(nextView); setPagination({ page: 1, pageSize: nextView === "grid" ? 12 : 10 }) }} onReset={resetFilters} onSelectVisible={selectVisible} /><FramePhotoBulkActions count={selectedIds.size} onActivate={() => { updateStatus([...selectedIds], "active"); toast.success(`${selectedIds.size} frames activated`) }} onArchive={() => setConfirmation({ ids: [...selectedIds], action: "archive" })} onAssign={() => setAssignmentIds([...selectedIds])} onDelete={() => setConfirmation({ ids: [...selectedIds], action: "delete" })} onClear={() => setSelectedIds(new Set())} />{visibleFrames.length === 0 ? <FramePhotoEmptyState filtered={frames.length > 0 && countActiveFrameFilters(filters) > 0} onReset={resetFilters} onCreate={() => setCreateOpen(true)} /> : view === "grid" ? <FramePhotoGrid frames={visibleFrames} selectedIds={selectedIds} onSelectionChange={toggleSelection} actions={actions} /> : <FramePhotoList frames={visibleFrames} selectedIds={selectedIds} onSelectionChange={toggleSelection} actions={actions} />}<FramePhotoPagination pagination={currentPagination} totalItems={filteredFrames.length} totalPages={totalPages} view={view} onChange={setPagination} /><FramePhotoPreviewDialog frame={previewFrame} open={previewFrame !== null} onOpenChange={(open) => !open && setPreviewId(null)} onEdit={actions.onEdit} onDuplicate={actions.onDuplicate} />{(createOpen || editFrame) && <FramePhotoFormDialog key={editFrame?.id ?? "new-frame"} frame={editFrame} existingFrames={frames} open onOpenChange={(open) => { if (!open) { setCreateOpen(false); setEditId(null) } }} onSave={handleSaveFrame} />}{assignmentIds.length > 0 && <FramePhotoAssignmentDialog key={assignmentIds.join("-")} frameCount={assignmentIds.length} kiosks={framePhotoKiosks} initialKioskIds={initialAssignmentIds} open onOpenChange={(open) => !open && setAssignmentIds([])} onSave={handleAssignmentSave} />}{confirmation && <FramePhotoConfirmationDialog key={`${confirmation.action}-${confirmation.ids.join("-")}`} frames={confirmationFrames} action={confirmation.action} open onOpenChange={(open) => !open && setConfirmation(null)} onConfirm={handleConfirmation} />}<Toaster position="top-right" /></div>
}

