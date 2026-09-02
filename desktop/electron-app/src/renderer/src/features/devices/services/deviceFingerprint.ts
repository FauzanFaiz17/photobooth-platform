import { v4 as uuid } from 'uuid'
import { storage } from '../../../services/storage'

export async function getDeviceUuid() {
  let deviceUuid = await storage.get<string>('device_uuid')

  if (!deviceUuid) {
    deviceUuid = uuid()

    await storage.set('device_uuid', deviceUuid)
  }

  return deviceUuid
}
