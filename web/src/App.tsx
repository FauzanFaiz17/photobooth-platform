import { lazy, Suspense } from "react"
import { Navigate, Route, Routes } from "react-router-dom"
import { SidebarLayout } from "./components/Layout/sidebar-layout"
import { Skeleton } from "./components/ui/skeleton"
import {
  AnonymousOnly,
  RequireAuth,
  RequireSuperAdmin,
} from "./components/auth/auth-route"
import LoginPage from "./pages/LoginPage"

const OverviewPage = lazy(() => import("./pages/OverviewPage"))
const ForbiddenPage = lazy(() => import("./pages/ForbiddenPage"))
const KioskPage = lazy(() => import("./pages/KioskPage"))
const KioskBoothDetailPage = lazy(
  () => import("./pages/KioskBoothDetailPage")
)
const BoothDetailPage = lazy(() => import("./pages/BoothDetailPage"))
const EventPage = lazy(() => import("./pages/EventPage"))
const EventDetailPage = lazy(() => import("./pages/EventDetailPage"))
const GalleryPage = lazy(() => import("./pages/GalleryPage"))
const StatisticsPage = lazy(() => import("./pages/StatisticsPage"))
const TransactionsPage = lazy(() => import("./pages/TransactionsPage"))
const PrintJobsPage = lazy(() => import("./pages/PrintJobsPage"))
const FramePhotoPage = lazy(() => import("./pages/FramePhotoPage"))
const VoucherPage = lazy(() => import("./pages/VoucherPage"))
const VoucherDetailPage = lazy(() => import("./pages/VoucherDetailPage"))
const PaymentKeyPage = lazy(() => import("./pages/PaymentKeyPage"))
const UserManagementPage = lazy(
  () => import("./pages/UserManagementPage")
)
const UserDetailPage = lazy(() => import("./pages/UserDetailPage"))
const PartnerDetailPage = lazy(() => import("./pages/PartnerDetailPage"))
const ProfilePage = lazy(() => import("./pages/ProfilePage"))
const SubscriptionManagementPage = lazy(() => import("./pages/SubscriptionManagementPage"))
const AuditLogPage = lazy(() => import("./pages/AuditLogPage"))
const CustomersPage = lazy(() => import("./pages/CustomersPage"))
const PublicGalleryPage = lazy(() => import("./pages/PublicGalleryPage"))

function OverviewPageFallback() {
  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8" aria-label="Loading Overview">
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-80 w-full" />
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route element={<AnonymousOnly />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>
      <Route
        path="/gallery/:token"
        element={
          <Suspense fallback={<OverviewPageFallback />}>
            <PublicGalleryPage />
          </Suspense>
        }
      />

      <Route element={<RequireAuth />}>
        <Route path="/admin" element={<SidebarLayout />}>
          <Route
            index
            element={
              <Suspense fallback={<OverviewPageFallback />}>
                <OverviewPage />
              </Suspense>
            }
          />
          <Route
            path="kiosk"
            element={
              <Suspense fallback={<OverviewPageFallback />}>
                <KioskPage />
              </Suspense>
            }
          />
          <Route
            path="kiosk/:partnerId"
            element={
              <Suspense fallback={<OverviewPageFallback />}>
                <KioskBoothDetailPage />
              </Suspense>
            }
          />
          <Route
            path="kiosk/:partnerId/booths/:boothId"
            element={
              <Suspense fallback={<OverviewPageFallback />}>
                <BoothDetailPage />
              </Suspense>
            }
          />
          <Route
            path="events"
            element={
              <Suspense fallback={<OverviewPageFallback />}>
                <EventPage />
              </Suspense>
            }
          />
          <Route
            path="events/:eventId"
            element={
              <Suspense fallback={<OverviewPageFallback />}>
                <EventDetailPage />
              </Suspense>
            }
          />
          <Route
            path="gallery"
            element={
              <Suspense fallback={<OverviewPageFallback />}>
                <GalleryPage />
              </Suspense>
            }
          />
          <Route
            path="forbidden"
            element={
              <Suspense fallback={<OverviewPageFallback />}>
                <ForbiddenPage />
              </Suspense>
            }
          />
          <Route
            path="profile"
            element={
              <Suspense fallback={<OverviewPageFallback />}>
                <ProfilePage />
              </Suspense>
            }
          />
          <Route
            path="subscriptions"
            element={
              <Suspense fallback={<OverviewPageFallback />}>
                <SubscriptionManagementPage />
              </Suspense>
            }
          />
          <Route element={<RequireSuperAdmin />}>
            <Route path="audit-logs" element={<Suspense fallback={<OverviewPageFallback />}><AuditLogPage /></Suspense>} />
            <Route
              path="payment-key"
              element={
                <Suspense fallback={<OverviewPageFallback />}>
                  <PaymentKeyPage />
                </Suspense>
              }
            />
            <Route
              path="settings/users"
              element={
                <Suspense fallback={<OverviewPageFallback />}>
                  <UserManagementPage />
                </Suspense>
              }
            />
            <Route
              path="settings/users/:userId"
              element={
                <Suspense fallback={<OverviewPageFallback />}>
                  <UserDetailPage />
                </Suspense>
              }
            />
            <Route
              path="settings/partners/:partnerId"
              element={
                <Suspense fallback={<OverviewPageFallback />}>
                  <PartnerDetailPage />
                </Suspense>
              }
            />
          </Route>
          <Route
            path="*"
            element={
              <div className="p-6">
                <h1 className="text-2xl font-semibold">
                  Halaman belum tersedia
                </h1>
                <p className="mt-2 text-muted-foreground">
                  Menu ini belum memiliki halaman.
                </p>
              </div>
            }
          />
        </Route>
        <Route path="/statistics" element={<SidebarLayout />}>
          <Route
            index
            element={
              <Suspense fallback={<OverviewPageFallback />}>
                <StatisticsPage />
              </Suspense>
            }
          />
        </Route>
        <Route path="/transactions" element={<SidebarLayout />}>
          <Route
            index
            element={
              <Suspense fallback={<OverviewPageFallback />}>
                <TransactionsPage />
              </Suspense>
            }
          />
        </Route>
        <Route path="/print-jobs" element={<SidebarLayout />}>
          <Route index element={<Suspense fallback={<OverviewPageFallback />}><PrintJobsPage /></Suspense>} />
        </Route>
        <Route path="/customers" element={<SidebarLayout />}>
          <Route index element={<Suspense fallback={<OverviewPageFallback />}><CustomersPage /></Suspense>} />
        </Route>
        <Route path="/frame-photo" element={<SidebarLayout />}>
          <Route
            index
            element={
              <Suspense fallback={<OverviewPageFallback />}>
                <FramePhotoPage />
              </Suspense>
            }
          />
        </Route>
        <Route path="/frame" element={<SidebarLayout />}>
          <Route
            index
            element={
              <Suspense fallback={<OverviewPageFallback />}>
                <FramePhotoPage />
              </Suspense>
            }
          />
        </Route>
        <Route path="/voucher" element={<SidebarLayout />}>
          <Route
            index
            element={
              <Suspense fallback={<OverviewPageFallback />}>
                <VoucherPage />
              </Suspense>
            }
          />
          <Route
            path=":kioskId"
            element={
              <Suspense fallback={<OverviewPageFallback />}>
                <VoucherDetailPage />
              </Suspense>
            }
          />
        </Route>
      </Route>
    </Routes>
  )
}

export default App
