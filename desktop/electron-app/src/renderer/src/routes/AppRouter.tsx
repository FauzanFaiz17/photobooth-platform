import { HashRouter, Routes, Route } from 'react-router-dom'
import type { JSX } from 'react'

import AuthLayout from '../layouts/AuthLayout'
import BoothLayout from '../layouts/BoothLayout'
import GuestRoute from './GuestRoute'
import ProtectedRoute from './ProtectedRoute'
import { RegisteredDeviceRoute, UnregisteredDeviceRoute } from './DeviceRegistrationRoute'

import CameraSettingsPage from '../pages/CameraSettingsPage'
import SplashPage from '../pages/SplashPage'
import LoginPage from '../pages/LoginPage'
import DeviceActivationPage from '../pages/DeviceActivationPage'
import DashboardPage from '../pages/DashboardPage'
import PaymentPage from '../pages/PaymentPage'
import TemplatePage from '../pages/TemplatePage'
import FilterPage from '../pages/FilterPage'
import CameraPage from '../pages/CameraPage'
import PreviewPage from '../pages/PreviewPage'
import FinishPage from '../pages/FinishPage'

export default function AppRouter(): JSX.Element {
  return (
    <HashRouter>
      <Routes>
        {/* override buat testing*/}

        <Route element={<AuthLayout />}>
          <Route path="/" element={<SplashPage />} />
          <Route element={<UnregisteredDeviceRoute />}>
            <Route path="/activate-device" element={<DeviceActivationPage />} />
          </Route>
          <Route element={<RegisteredDeviceRoute />}>
            <Route element={<GuestRoute />}>
              <Route path="/login" element={<LoginPage />} />
            </Route>
          </Route>
        </Route>

        <Route element={<RegisteredDeviceRoute />}>
          <Route element={<ProtectedRoute />}>
            <Route element={<BoothLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />

              <Route path="/payment" element={<PaymentPage />} />

              <Route path="/template" element={<TemplatePage />} />

              <Route path="/filter" element={<FilterPage />} />

              <Route path="/camera" element={<CameraPage />} />

              <Route path="/camerasettings" element={<CameraSettingsPage />} />

              <Route path="/preview" element={<PreviewPage />} />

              <Route path="/finish" element={<FinishPage />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </HashRouter>
  )
}
