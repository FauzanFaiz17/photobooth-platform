import type { JSX } from 'react'

import { useDeviceHeartbeat } from '@/features/devices/hooks/useDeviceHeartbeat'
import AppRouter from './routes/AppRouter'

export default function App(): JSX.Element {
  useDeviceHeartbeat()

  // Proses autentikasi, device, dan bootstrap data dilakukan
  // di SplashPage (route "/"), karena UI perlu menunggu hasilnya
  // sebelum memutuskan halaman tujuan (login vs dashboard).
  return <AppRouter />
}
