import { restoreAuth } from "./restoreAuth";

import { restoreDevice } from "./restoreDevice";

import { restoreBootstrap } from "./restoreBootstrap";

import type {

    StartupResult

} from "./types";

export async function initialize():
Promise<StartupResult> {

    const authenticated =
        await restoreAuth();

    if (!authenticated) {

        return {

            authenticated: false,

            bootstrapLoaded: false,

            deviceRegistered: false,

        };

    }

    await restoreDevice();

    const bootstrapLoaded =
        await restoreBootstrap();

    return {

        authenticated: true,

        bootstrapLoaded,

        deviceRegistered: true,

    };

}