import api from './axios'

interface ApiEnvelope<T> {
  success: boolean
  message: string
  data: T
}
export interface Customer {
  id: number
  name: string | null
  email: string | null
  phone: string | null
}

export async function resolveCustomer(payload: {
  name?: string
  email?: string
  phone?: string
}): Promise<Customer> {
  const response = await api.post<ApiEnvelope<Customer>>('/v1/desktop/customers/resolve', payload)
  return response.data.data
}
