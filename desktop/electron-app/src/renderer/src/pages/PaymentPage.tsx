import { useEffect, useMemo } from 'react'
import type { JSX } from 'react'
import { useNavigate } from 'react-router-dom'

import { NeoButton } from '@/components/shared/button'
import { useSessionStore } from '@/store/sessionStore'
import { useState } from 'react'
import { createQrisPayment, getPayment, redeemVoucher } from '@/api/payment'
import type { Payment } from '@/api/payment'
import Alert from '@/components/ui/Alert'
import { NeoInput } from '@/components/shared/input'

export default function PaymentPage(): JSX.Element | null {
  const navigate = useNavigate()
  const configuration = useSessionStore((state) => state.eventConfiguration)
  const paperSize = useSessionStore((state) => state.paperSize)
  const selectedOption = useSessionStore((state) => state.printOption)
  const quantity = useSessionStore((state) => state.quantity)
  const setPrintSelection = useSessionStore((state) => state.setPrintSelection)
  const setPaymentId = useSessionStore((state) => state.setPaymentId)
  const [method, setMethod] = useState<'qris' | 'voucher'>('qris')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [qrisPayment, setQrisPayment] = useState<Payment | null>(null)
  useEffect(() => {
    if (!qrisPayment || qrisPayment.status !== 'pending') return
    const timer = window.setInterval(() => {
      void getPayment(qrisPayment.id)
        .then(setQrisPayment)
        .catch(() => undefined)
    }, 5000)
    return () => window.clearInterval(timer)
  }, [qrisPayment])
  useEffect(() => {
    if (qrisPayment?.status !== 'paid') return
    setPaymentId(qrisPayment.id)
    navigate('/customer')
  }, [navigate, qrisPayment, setPaymentId])
  const options = useMemo(
    () =>
      (configuration?.print_options ?? configuration?.event.print_options ?? []).filter(
        (item) => item.is_active && item.paper_size === paperSize
      ),
    [configuration, paperSize]
  )
  const option = selectedOption?.paper_size === paperSize ? selectedOption : options[0]

  if (!configuration || !paperSize || !option) return null

  const currentQuantity = quantity || option.unit_quantity
  const multiplier = Math.max(1, currentQuantity / option.unit_quantity)
  const total = Number(option.price) * multiplier

  return (
    <main className="flex h-full flex-col items-center justify-center gap-6 bg-(--background) p-5 text-(--foreground) md:p-8">
      <div className="w-full max-w-2xl border-4 border-(--border) bg-(--surface) p-6 text-center shadow-[12px_12px_0_0_var(--border)] md:p-10">
        <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-(--danger)">
          05 / Print package
        </p>
        <h1 className="text-4xl font-black tracking-[-0.04em]">
          Jumlah Cetak {paperSize.toUpperCase()}
        </h1>
        <div className="mt-8 flex items-center justify-center gap-5">
          <NeoButton
            onClick={() =>
              setPrintSelection(
                option,
                Math.max(option.unit_quantity, currentQuantity - option.quantity_step)
              )
            }
            variant="outlined"
            className="h-14 w-14 flex text-center p-0 text-2xl [transition:none]"
          >
            -
          </NeoButton>
          <div className="min-w-32 text-center">
            <p className="text-6xl font-black tracking-tighter">{currentQuantity}</p>
            <p className="font-bold text-(--muted-foreground)">lembar</p>
          </div>
          <NeoButton
            onClick={() => setPrintSelection(option, currentQuantity + option.quantity_step)}
            className="h-14 w-14 flex text-center p-0 text-2xl [transition:none]"
          >
            +
          </NeoButton>
        </div>
        <p className="mt-6 text-3xl font-black">Rp {total.toLocaleString('id-ID')}</p>
        <div className="mt-6 flex justify-center gap-3">
          <NeoButton
            onClick={() => setMethod('qris')}
            variant={method === 'qris' ? 'primary' : 'outlined'}
            className="[transition:none]"
          >
            QRIS
          </NeoButton>
          <NeoButton
            onClick={() => setMethod('voucher')}
            variant={method === 'voucher' ? 'secondary' : 'outlined'}
            className="[transition:none]"
          >
            Voucher
          </NeoButton>
        </div>
        {method === 'voucher' && (
          <NeoInput
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            placeholder="Kode voucher"
            className='mt-4'
          />
        )}
        {method === 'qris' && qrisPayment && (
          <div className="w-full max-w-lg space-y-2 border-4 border-(--border) bg-(--accent) p-4 text-center shadow-[var(--shadow-neo)]">
            <p className="font-semibold">
              Status:{' '}
              {qrisPayment.status === 'pending' ? 'Menunggu pembayaran' : qrisPayment.status}
            </p>
            <p className="text-sm text-slate-600">
              Order aplikasi: <span className="font-mono">{qrisPayment.reference}</span>
            </p>
            <p className="text-sm text-slate-600">
              ID transaksi Midtrans:{' '}
              <span className="font-mono">
                {String(qrisPayment.gateway_response?.transaction_id ?? '-')}
              </span>
            </p>
            {Boolean(qrisPayment.gateway_response?.qr_url) && (
              <a
                className="break-all text-sm text-blue-700 underline"
                href={String(qrisPayment.gateway_response?.qr_url)}
                target="_blank"
                rel="noreferrer"
              >
                Buka QRIS
              </a>
            )}
            <p className="break-all text-xs text-slate-500">
              QR string: {String(qrisPayment.gateway_response?.qr_string ?? '-')}
            </p>
            {qrisPayment.status === 'pending' && (
              <p className="text-xs text-slate-600">
                Sandbox: buka QRIS melalui tautan di atas, lalu scan menggunakan Midtrans Simulator
                QRIS. Order dan ID transaksi hanya digunakan untuk pelacakan. Status akan berubah
                setelah notifikasi diterima.
              </p>
            )}
          </div>
        )}
        {error && <Alert type="error">{error}</Alert>}
        <div className="mt-8 flex w-full flex-wrap justify-between gap-3">
          <NeoButton
            onClick={() => navigate('/template')}
            variant="outlined"
            className="[transition:none]"
          >
            Kembali
          </NeoButton>
          <NeoButton
            disabled={loading}
            onClick={async () => {
              setLoading(true)
              setError(null)
              try {
                let payment: Payment
                if (method === 'voucher') payment = await redeemVoucher(code)
                else {
                  payment = qrisPayment
                    ? await getPayment(qrisPayment.id)
                    : await createQrisPayment(configuration.event.id, total, {
                        id: option.id,
                        paper_size: option.paper_size,
                        quantity: currentQuantity
                      })
                  setQrisPayment(payment)
                }
                if (payment.status !== 'paid') {
                  setError(
                    'Pembayaran belum terkonfirmasi. Selesaikan pembayaran di Simulator, lalu tekan Periksa Status.'
                  )
                  return
                }
                setPaymentId(payment.id)
                navigate('/customer')
              } catch (cause) {
                const axiosError = cause as {
                  response?: { data?: { message?: string; errors?: Record<string, string[]> } }
                }
                const detail = axiosError.response?.data?.errors
                  ? Object.values(axiosError.response.data.errors)[0]?.[0]
                  : axiosError.response?.data?.message
                setError(detail ?? (cause instanceof Error ? cause.message : 'Pembayaran gagal.'))
              } finally {
                setLoading(false)
              }
            }}
            className="[transition:none]"
          >
            {loading ? 'Memproses...' : qrisPayment ? 'Periksa Status' : 'Buat QRIS'}
          </NeoButton>
        </div>
      </div>
    </main>
  )
}
