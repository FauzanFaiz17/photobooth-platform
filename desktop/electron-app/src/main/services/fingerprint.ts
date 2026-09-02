import { machineIdSync } from 'node-machine-id'
import si from 'systeminformation'

export interface DeviceFingerprint {
  deviceUuid: string

  windowsUuid: string

  cpuIdentifier: string

  macAddress: string

  appVersion: string
}

export async function getFingerprint(): Promise<DeviceFingerprint> {
  const system = await si.system()

  const cpu = await si.cpu()

  const networks = await si.networkInterfaces()

  const mac = networks.find((n) => !n.internal && n.mac)

  return {
    deviceUuid: machineIdSync(true),

    windowsUuid: system.uuid || '',

    cpuIdentifier: cpu.brand,

    macAddress: mac?.mac || '',

    appVersion: '1.0.0'
  }
}
