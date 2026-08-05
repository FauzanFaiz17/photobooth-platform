import { deviceStorage } from "@/features/devices/services/deviceStorage";

import { useDeviceStore } from "@/store/deviceStore";

export async function restoreDevice() {

    const fingerprint =
        await deviceStorage.getFingerprint();

    if (!fingerprint) {

        return false;

    }

    useDeviceStore
        .getState()
        .setFingerprint(
            fingerprint
        );

    return true;

}