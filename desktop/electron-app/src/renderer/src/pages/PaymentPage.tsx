import { useEffect, useMemo } from 'react'
import type { JSX } from 'react'
import { useNavigate } from 'react-router-dom'

import Button from '@/components/ui/Button'
import { useSessionStore } from '@/store/sessionStore'
import { useState } from 'react'
import { createQrisPayment, getPayment, redeemVoucher } from '@/api/payment'
import type { Payment } from '@/api/payment'
import Alert from '@/components/ui/Alert'
import Input from '@/components/ui/Input'

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
    <div className="flex h-full flex-col items-center justify-center gap-6">
      <h1 className="text-2xl font-bold text-slate-800">Jumlah Cetak {paperSize.toUpperCase()}</h1>
      <div className="flex items-center gap-5">
        <Button
          onClick={() =>
            setPrintSelection(
              option,
              Math.max(option.unit_quantity, currentQuantity - option.quantity_step)
            )
          }
        >
          -
        </Button>
        <div className="min-w-32 text-center">
          <p className="text-4xl font-bold">{currentQuantity}</p>
          <p className="text-slate-500">lembar</p>
        </div>
        <Button onClick={() => setPrintSelection(option, currentQuantity + option.quantity_step)}>
          +
        </Button>
      </div>
      <p className="text-2xl font-semibold">Rp {total.toLocaleString('id-ID')}</p>
      <div className="flex gap-3">
        <Button
          onClick={() => setMethod('qris')}
          className={method === 'qris' ? '' : 'bg-slate-400'}
        >
          QRIS
        </Button>
        <Button
          onClick={() => setMethod('voucher')}
          className={method === 'voucher' ? '' : 'bg-slate-400'}
        >
          Voucher
        </Button>
      </div>
      {method === 'voucher' && (
        <Input
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          placeholder="Kode voucher"
        />
      )}
      {method === 'qris' && qrisPayment && (
        <div className="w-full max-w-lg space-y-2 rounded-lg border border-blue-200 bg-blue-50 p-4 text-center">
          <p className="font-semibold">
            Status: {qrisPayment.status === 'pending' ? 'Menunggu pembayaran' : qrisPayment.status}
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
      <div className="flex gap-3">
        <Button onClick={() => navigate('/filter')} className="bg-slate-500 hover:bg-slate-600">
          Kembali
        </Button>
        <Button
          loading={loading}
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
        >
          {qrisPayment ? 'Periksa Status' : 'Buat QRIS'}
        </Button>
      </div>
    </div>
  )
}
