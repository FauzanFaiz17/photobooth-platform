import { useSearchParams } from "react-router-dom"

import { PartnerListPage } from "@/components/partner-management/partner-list-page"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { UserListPage } from "@/components/user-management/user-list-page"

const SETTINGS_TABS = ["users", "partners"] as const

type SettingsTab = (typeof SETTINGS_TABS)[number]

function isSettingsTab(value: unknown): value is SettingsTab {
  return SETTINGS_TABS.some((tab) => tab === value)
}

export default function UserManagementPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get("tab")
  const tab: SettingsTab = isSettingsTab(tabParam) ? tabParam : "users"

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => {
        if (!isSettingsTab(value) || value === tab) return

        // Filter kedua tab memakai nama query yang sama, jadi query
        // direset saat berpindah agar filter tab lain tidak terbawa.
        setSearchParams(
          value === "users"
            ? new URLSearchParams()
            : new URLSearchParams({ tab: value }),
          { replace: true }
        )
      }}
      className="min-w-0"
    >
      <div className="px-4 pt-4 sm:px-6 lg:px-8">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="partners">Partners</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="users">
        <UserListPage />
      </TabsContent>

      <TabsContent value="partners">
        <PartnerListPage />
      </TabsContent>
    </Tabs>
  )
}
