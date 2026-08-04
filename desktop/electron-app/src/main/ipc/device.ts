import { ipcMain } from "electron";

import {

    getFingerprint

} from "../services/fingerprint";

export function registerDeviceIpc() {

    ipcMain.handle(

        "device:fingerprint",

        async () => {

            return await getFingerprint();

        }

    );

}