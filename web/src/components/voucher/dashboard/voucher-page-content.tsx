import { useMemo, useState, type ReactElement } from "react"
import { toast } from "sonner"
import { Toaster } from "@/components/ui/sonner"
import { defaultVoucherFilters, initialVouchers, voucherReferenceTime, voucherSummary } from "../data/voucher-data"
import { VoucherDetailSheet } from "../detail/voucher-detail-sheet"
import { VoucherBatchResultDialog } from "../dialogs/voucher-batch-result-dialog"
import { VoucherDeleteDialog } from "../dialogs/voucher-delete-dialog"
import { VoucherDisableDialog } from "../dialogs/voucher-disable-dialog"
import { VoucherExtendDialog } from "../dialogs/voucher-extend-dialog"
import { VoucherGenerateDialog } from "../dialogs/voucher-generate-dialog"
import { VoucherHeader } from "../header/voucher-header"
import { VoucherFlowAlert } from "../info/voucher-flow-alert"
import { VoucherEmptyState, VoucherSkeleton } from "../shared/voucher-states"
import { VoucherValidationSimulator } from "../simulator/voucher-validation-simulator"
import { VoucherSummaryCards } from "../summary/voucher-summary-cards"
import { VoucherBulkActions } from "../table/voucher-bulk-actions"
import { VoucherPagination } from "../table/voucher-pagination"
import { VoucherTable, type VoucherRowActions } from "../table/voucher-table"
import { VoucherToolbar } from "../toolbar/voucher-toolbar"
import type { Voucher, VoucherDisableReason, VoucherExtendValues, VoucherFilters, VoucherGenerateFormValues, VoucherGenerationResult, VoucherPaginationState } from "../types/voucher.types"
import { duplicateVoucherConfiguration, generateVouchers, redeemVoucher } from "../utils/voucher-generation"
import { canEnableVoucher, copyVoucherText, filterVouchers, getVoucherEffectiveStatus, sortVouchers } from "../utils/voucher-utils"

interface DialogSelection { readonly ids: ReadonlyArray<string> }
interface DeleteSelection extends DialogSelection { readonly skippedCount: number }

export function VoucherPageContent(): ReactElement {
  const [vouchers, setVouchers] = useState<ReadonlyArray<Voucher>>(initialVouchers)
  const [filters, setFilters] = useState<VoucherFilters>(defaultVoucherFilters)
  const [pagination, setPagination] = useState<VoucherPaginationState>({ page: 1, pageSize: 20 })
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(() => new Set())
  const [generateOpen, setGenerateOpen] = useState(false)
  const [generationResult, setGenerationResult] = useState<VoucherGenerationResult | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [disableSelection, setDisableSelection] = useState<DialogSelection | null>(null)
  const [extendSelection, setExtendSelection] = useState<DialogSelection | null>(null)
  const [deleteSelection, setDeleteSelection] = useState<DeleteSelection | null>(null)
  const isLoading = false

  const filtered = useMemo(() => sortVouchers(filterVouchers(vouchers, filters), filters.sort), [vouchers, filters])
  const totalPages = Math.max(1, Math.ceil(filtered.length / pagination.pageSize))
  const currentPagination = pagination.page > totalPages ? { ...pagination, page: totalPages } : pagination
  const start = (currentPagination.page - 1) * currentPagination.pageSize
  const visible = filtered.slice(start, start + currentPagination.pageSize)
  const visibleIds = visible.map((voucher) => voucher.id)
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id))
  const someVisibleSelected = !allVisibleSelected && visibleIds.some((id) => selectedIds.has(id))
  const detailVoucher = vouchers.find((voucher) => voucher.id === detailId) ?? null
  const disableVouchers = vouchers.filter((voucher) => disableSelection?.ids.includes(voucher.id) ?? false)
  const extendVouchers = vouchers.filter((voucher) => extendSelection?.ids.includes(voucher.id) ?? false)
  const deleteVouchers = vouchers.filter((voucher) => deleteSelection?.ids.includes(voucher.id) ?? false)

  function updateFilters(next: VoucherFilters): void { setFilters(next); setPagination((current) => ({ ...current, page: 1 })) }
  function toggleSelection(id: string, checked: boolean): void { setSelectedIds((current) => { const next = new Set(current); if (checked) next.add(id); else next.delete(id); return next }) }
  function toggleVisible(checked: boolean): void { setSelectedIds((current) => { const next = new Set(current); for (const id of visibleIds) { if (checked) next.add(id); else next.delete(id) } return next }) }
  async function copyCodes(items: ReadonlyArray<Voucher>): Promise<void> { const success = await copyVoucherText(items.map((voucher) => voucher.code).join("\n")); toast[success ? "success" : "error"](success ? `${items.length} voucher code${items.length === 1 ? "" : "s"} copied.` : "Clipboard is not available.") }
  function updateStoredStatus(ids: ReadonlyArray<string>, storedStatus: Voucher["storedStatus"]): void { const targets = new Set(ids); setVouchers((current) => current.map((voucher) => targets.has(voucher.id) ? { ...voucher, storedStatus, updatedAt: voucherReferenceTime } : voucher)) }
  function requestDelete(items: ReadonlyArray<Voucher>): void { const unused = items.filter((voucher) => voucher.redemptionCount === 0); if (unused.length === 0) { toast.error("Used vouchers cannot be deleted."); return } setDeleteSelection({ ids: unused.map((voucher) => voucher.id), skippedCount: items.length - unused.length }) }

  const actions: VoucherRowActions = {
    view: (voucher) => setDetailId(voucher.id),
    copy: (voucher) => { void copyCodes([voucher]) },
    history: (voucher) => setDetailId(voucher.id),
    extend: (voucher) => setExtendSelection({ ids: [voucher.id] }),
    disable: (voucher) => setDisableSelection({ ids: [voucher.id] }),
    enable: (voucher) => { if (!canEnableVoucher(voucher)) { toast.error("Expired or fully redeemed vouchers cannot be enabled."); return } updateStoredStatus([voucher.id], "enabled"); toast.success(`${voucher.code} enabled.`) },
    duplicate: (voucher) => { const copy = duplicateVoucherConfiguration(voucher, vouchers); setVouchers((current) => [copy, ...current]); toast.success("Voucher configuration duplicated", { description: copy.code }) },
    delete: (voucher) => requestDelete([voucher]),
  }

  function handleGenerate(values: VoucherGenerateFormValues): void {
    try { const generated = generateVouchers(values, vouchers); setVouchers((current) => [...generated, ...current]); setGenerateOpen(false); setGenerationResult({ name: values.name, vouchers: generated }); toast.success(`${generated.length} voucher${generated.length === 1 ? "" : "s"} generated.`) } catch (error) { toast.error(error instanceof Error ? error.message : "Voucher generation failed.") }
  }
  function handleDisable(reason: VoucherDisableReason): void { if (!disableSelection) return; updateStoredStatus(disableSelection.ids, "disabled"); toast.success(`${disableSelection.ids.length} voucher${disableSelection.ids.length === 1 ? "" : "s"} disabled.`, { description: `Reason recorded: ${reason.replaceAll("_", " ")}.` }); setDisableSelection(null) }
  function handleExtend(values: VoucherExtendValues): void { if (!extendSelection) return; const expiresAt = new Date(`${values.expirationDate}T${values.expirationTime}:00+07:00`).toISOString(); const targets = new Set(extendSelection.ids); setVouchers((current) => current.map((voucher) => targets.has(voucher.id) ? { ...voucher, expiresAt, updatedAt: voucherReferenceTime, internalNote: [voucher.internalNote, values.reason, values.internalNote].filter(Boolean).join(" · ") } : voucher)); toast.success(`${extendSelection.ids.length} voucher validity updated.`); setExtendSelection(null) }
  function handleDelete(): void { if (!deleteSelection) return; const targets = new Set(deleteSelection.ids); setVouchers((current) => current.filter((voucher) => !targets.has(voucher.id))); setSelectedIds((current) => new Set([...current].filter((id) => !targets.has(id)))); toast.success(`${deleteSelection.ids.length} unused voucher${deleteSelection.ids.length === 1 ? "" : "s"} deleted.`, deleteSelection.skippedCount ? { description: `${deleteSelection.skippedCount} used voucher(s) were kept.` } : undefined); setDeleteSelection(null) }
  function handleRedemption(voucher: Voucher, input: Parameters<typeof redeemVoucher>[1]): void { setVouchers((current) => current.map((item) => item.id === voucher.id ? redeemVoucher(item, input) : item)); toast.success("Voucher redeemed", { description: `${voucher.code} was recorded for a dummy session.` }) }

  const selectedVouchers = vouchers.filter((voucher) => selectedIds.has(voucher.id))
  if (isLoading) return <VoucherSkeleton />
  return <div className="min-w-0 space-y-7 p-4 sm:p-6 lg:p-8"><VoucherHeader onExport={(format) => toast.success(`${format.toUpperCase()} export prepared for the demo.`)} onGenerate={() => setGenerateOpen(true)} /><VoucherFlowAlert /><VoucherSummaryCards summary={voucherSummary} /><VoucherValidationSimulator vouchers={vouchers} onRedeem={handleRedemption} /><VoucherToolbar filters={filters} resultCount={filtered.length} totalCount={vouchers.length} onChange={updateFilters} onReset={() => updateFilters(defaultVoucherFilters)} /><VoucherBulkActions count={selectedIds.size} onCopy={() => { void copyCodes(selectedVouchers) }} onExport={() => toast.success(`${selectedIds.size} selected vouchers prepared for export.`)} onExtend={() => { const eligible = selectedVouchers.filter((voucher) => voucher.expiresAt && getVoucherEffectiveStatus(voucher) !== "redeemed"); if (eligible.length === 0) toast.error("No selected vouchers can be extended."); else setExtendSelection({ ids: eligible.map((voucher) => voucher.id) }) }} onDisable={() => { const eligible = selectedVouchers.filter((voucher) => ["active", "scheduled", "partially_used"].includes(getVoucherEffectiveStatus(voucher))); if (eligible.length === 0) toast.error("No selected vouchers can be disabled."); else setDisableSelection({ ids: eligible.map((voucher) => voucher.id) }) }} onEnable={() => { const eligible = selectedVouchers.filter((voucher) => getVoucherEffectiveStatus(voucher) === "disabled" && canEnableVoucher(voucher)); if (eligible.length === 0) toast.error("No selected vouchers can be enabled."); else { updateStoredStatus(eligible.map((voucher) => voucher.id), "enabled"); toast.success(`${eligible.length} vouchers enabled.`) } }} onDeleteUnused={() => requestDelete(selectedVouchers)} onClear={() => setSelectedIds(new Set())} />{visible.length === 0 ? <VoucherEmptyState filtered={vouchers.length > 0} onReset={() => updateFilters(defaultVoucherFilters)} onGenerate={() => setGenerateOpen(true)} /> : <VoucherTable vouchers={visible} selectedIds={selectedIds} allVisibleSelected={allVisibleSelected} someVisibleSelected={someVisibleSelected} onToggle={toggleSelection} onToggleVisible={toggleVisible} actions={actions} />}<VoucherPagination pagination={currentPagination} totalItems={filtered.length} onChange={setPagination} /><VoucherGenerateDialog open={generateOpen} onOpenChange={setGenerateOpen} onGenerate={handleGenerate} /><VoucherBatchResultDialog open={generationResult !== null} onOpenChange={(open) => !open && setGenerationResult(null)} result={generationResult} /><VoucherDetailSheet open={detailVoucher !== null} onOpenChange={(open) => !open && setDetailId(null)} voucher={detailVoucher} onCopy={actions.copy} onExtend={(voucher) => { setDetailId(null); setExtendSelection({ ids: [voucher.id] }) }} onToggleStatus={(voucher) => { setDetailId(null); if (getVoucherEffectiveStatus(voucher) === "disabled") actions.enable(voucher); else setDisableSelection({ ids: [voucher.id] }) }} onDuplicate={(voucher) => { actions.duplicate(voucher); setDetailId(null) }} /><VoucherDisableDialog open={disableSelection !== null} onOpenChange={(open) => !open && setDisableSelection(null)} vouchers={disableVouchers} onConfirm={handleDisable} /><VoucherExtendDialog open={extendSelection !== null} onOpenChange={(open) => !open && setExtendSelection(null)} vouchers={extendVouchers} onConfirm={handleExtend} /><VoucherDeleteDialog open={deleteSelection !== null} onOpenChange={(open) => !open && setDeleteSelection(null)} vouchers={deleteVouchers} skippedCount={deleteSelection?.skippedCount ?? 0} onConfirm={handleDelete} /><Toaster position="top-right" /></div>
}
