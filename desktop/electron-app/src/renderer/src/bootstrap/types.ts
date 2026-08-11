export interface StartupResult {
  authenticated: boolean

  deviceRegistered: boolean

  bootstrapLoaded: boolean
  loginMessage?: string
}
