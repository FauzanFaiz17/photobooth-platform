import { restoreAuth } from './restoreAuth'

import { restoreDevice } from './restoreDevice'

import { restoreBootstrap } from './restoreBootstrap'
import { restoreDeviceRegistration } from './restoreDeviceRegistration'

import type { StartupResult } from './types'

export async function initialize(): Promise<StartupResult> {
  await restoreDevice()

  const deviceRegistered = await restoreDeviceRegistration()

  if (!deviceRegistered) {
    return {
      authenticated: false,
      bootstrapLoaded: false,
      deviceRegistered: false
    }
  }

  const authenticated = await restoreAuth()

  if (!authenticated) {
    return {
      authenticated: false,

      bootstrapLoaded: false,

      deviceRegistered: true
    }
  }

  const bootstrap = await restoreBootstrap()

  if (bootstrap.loginMessage) {
    return {
      authenticated: false,
      bootstrapLoaded: false,
      deviceRegistered,
      loginMessage: bootstrap.loginMessage
    }
  }

  return {
    authenticated: true,

    bootstrapLoaded: bootstrap.loaded,

    deviceRegistered
  }
}
