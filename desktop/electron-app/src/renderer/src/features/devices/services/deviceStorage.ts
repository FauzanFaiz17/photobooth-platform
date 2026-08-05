import { storage } from "@/services/storage";

import type { DeviceFingerprint } from "../types";

const DEVICE_KEY = "device";

export const deviceStorage = {

    async saveFingerprint(
        fingerprint: DeviceFingerprint
    ) {

        await storage.set(
            DEVICE_KEY,
            fingerprint
        );

    },

    async getFingerprint(): Promise<DeviceFingerprint | null> {

        return await storage.get<DeviceFingerprint>(
            DEVICE_KEY
        );

    },

    async clear() {

        await storage.remove(
            DEVICE_KEY
        );

    }

};