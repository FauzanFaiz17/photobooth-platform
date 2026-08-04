import api from "@/api/axios";

export async function bootstrap() {

    const { data } =
        await api.get(
            "/v1/desktop/bootstrap"
        );

    return data;

}