import api from './axios'

interface ApiEnvelope<T> {
  success: boolean
  message: string
  data: T
}
export interface Payment {
  id: number
  reference: string
  gateway: string
  amount: number
  status: 'pending' | 'paid' | 'failed' | 'expired' | 'refunded'
  gateway_response?: Record<string, unknown>
  expired_at?: string | null
}

export async function createQrisPayment(
  eventId: number,
  amount: number,
  option?: { id: number; paper_size: string; quantity: number }
): Promise<Payment> {
  const response = await api.post<ApiEnvelope<Payment>>('/v1/desktop/payments', {
    event_id: eventId,
    amount,
    print_option_id: option?.id,
    paper_size: option?.paper_size,
    quantity: option?.quantity,
    gateway: 'midtrans_qris',
    idempotency_key: crypto.randomUUID()
  })
  return response.data.data
}

export async function getPayment(paymentId: number): Promise<Payment> {
  const response = await api.get<ApiEnvelope<Payment>>(`/v1/desktop/payments/${paymentId}`)
  return response.data.data
}

export async function redeemVoucher(code: string): Promise<Payment> {
  const response = await api.post<ApiEnvelope<{ payment: Payment }>>(
    '/v1/desktop/vouchers/redeem',
    { code }
  )
  return response.data.data.payment
}
