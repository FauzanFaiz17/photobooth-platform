import { useSearchParams } from "react-router-dom"

import { CameraGlobalSection } from "@/components/global-config/camera-global-section"
import { FilterGlobalSection } from "@/components/global-config/filter-global-section"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

const GLOBAL_TABS = ["camera", "filter"] as const

type GlobalTab = (typeof GLOBAL_TABS)[number]

function isGlobalTab(value: unknown): value is GlobalTab {
  return GLOBAL_TABS.some((tab) => tab === value)
}

export default function GlobalConfigPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get("tab")
  const tab: GlobalTab = isGlobalTab(tabParam) ? tabParam : "camera"

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => {
        if (!isGlobalTab(value) || value === tab) return

        setSearchParams(
          value === "camera"
            ? new URLSearchParams()
            : new URLSearchParams({ tab: value }),
          { replace: true }
        )
      }}
      className="min-w-0"
    >
      <div className="px-4 pt-4 sm:px-6 lg:px-8">
        <TabsList>
          <TabsTrigger value="camera">Camera</TabsTrigger>
          <TabsTrigger value="filter">Filter</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="camera">
        <CameraGlobalSection />
      </TabsContent>

      <TabsContent value="filter">
        <FilterGlobalSection />
      </TabsContent>
    </Tabs>
  )
}
