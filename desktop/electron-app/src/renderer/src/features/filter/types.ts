export interface PhotoFilter {
  id: string
  sourceId: number
  name: string
  /** CSS filter string, langsung dipakai di style={{ filter: cssFilter }} */
  cssFilter: string
  version: number
}
