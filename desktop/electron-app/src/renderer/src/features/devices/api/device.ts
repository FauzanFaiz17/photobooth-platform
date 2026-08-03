import api from "../../../api/axios";

export async function checkDevice(uuid: string) {

    const { data } = await api.post("/v1/devices/check", {

        uuid

    });

    return data;

}