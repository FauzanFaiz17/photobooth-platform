import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { initialize } from "@/bootstrap/initialize";

export default function SplashPage() {

    const navigate = useNavigate();

    const [error, setError] = useState<string | null>(null);

    const [attempt, setAttempt] = useState(0);

    useEffect(() => {

        let cancelled = false;

        async function run() {

            try {

                setError(null);

                const result = await initialize();

                if (cancelled) {

                    return;

                }

                if (!result.authenticated) {

                    navigate("/login", { replace: true });

                    return;

                }

                if (!result.bootstrapLoaded) {

                    setError(
                        "Data booth belum dapat dimuat. Periksa koneksi ke server lalu coba lagi."
                    );

                    return;

                }

                navigate("/dashboard", { replace: true });

            } catch (caughtError) {

                if (cancelled) {

                    return;

                }

                const message =
                    caughtError instanceof Error
                        ? caughtError.message
                        : "Terjadi kesalahan saat memuat aplikasi.";

                setError(message);

            }

        }

        run();

        return () => {

            cancelled = true;

        };

    }, [attempt, navigate]);

    return (

        <div className="flex h-screen flex-col items-center justify-center gap-4 px-6 text-center">

            <h1 className="text-3xl font-bold">

                Photobooth

            </h1>

            {error && (

                <div className="max-w-md space-y-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">

                    <p>{error}</p>

                    <button
                        type="button"
                        className="rounded-md bg-red-700 px-3 py-2 font-medium text-white"
                        onClick={() => setAttempt((current) => current + 1)}
                    >
                        Coba lagi
                    </button>

                </div>

            )}

        </div>

    );

}