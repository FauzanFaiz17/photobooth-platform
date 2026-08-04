export interface DeviceFingerprint {

    deviceUuid: string;

    windowsUuid: string;

    cpuIdentifier: string;

    macAddress: string;

    appVersion: string;

}

export interface Device {

    id: number;

    device_key: string;

    device_uuid: string;

    device_name: string;

    status: string;

}

export interface DeviceLocalState {

    fingerprint: DeviceFingerprint;

    registered: boolean;

    lastSync: string | null;

}