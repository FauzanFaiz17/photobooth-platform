import { bootstrap } from "@/services/bootstrapService";

import { useDeviceStore } from "@/stores/deviceStore";

export async function restoreBootstrap() {

    const response =
        await bootstrap();

    if (!response.success) {

        return false;

    }

    const data = response.data;

    if (data.device) {

        useDeviceStore
            .getState()
            .setDevice(
                data.device
            );

    }

    return true;

}