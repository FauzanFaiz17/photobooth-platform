import { getDeviceUuid } from '../services/deviceFingerprint'
import { checkDevice } from '../api/device'

export async function verifyDevice() {
  const uuid = await getDeviceUuid()

  return await checkDevice(uuid)
}
