import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useSessionStore } from "@/store/sessionStore";

const AUTO_REDIRECT_SECONDS = 8;

export default function FinishPage() {

    const navigate = useNavigate();

    const reset = useSessionStore((state) => state.reset);

    const shots = useSessionStore((state) => state.shots);

    const [secondsLeft, setSecondsLeft] = useState(AUTO_REDIRECT_SECONDS);

    useEffect(() => {

        if (shots.length === 0) {

            return;

        }

        void window.session.saveWebcamShots(
            shots.map((shot) => shot.dataUrl)
        );

    }, [shots]);
    useEffect(() => {

        const interval = setInterval(() => {

            setSecondsLeft((prev) => {

                if (prev <= 1) {

                    clearInterval(interval);

                    reset();

                    navigate("/dashboard", { replace: true });

                    return 0;

                }

                return prev - 1;

            });

        }, 1000);

        return () => clearInterval(interval);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (

        <div className="flex h-full flex-col items-center justify-center gap-4 text-center">

            <h1 className="text-4xl font-bold text-slate-800">Terima Kasih! 🎉</h1>

            <p className="text-lg text-slate-500">

                Sesi foto kamu sudah selesai. Foto mentah tersimpan di Pictures/Photobooth.

            </p>

            <p className="text-sm text-slate-400">

                Kembali ke layar utama dalam {secondsLeft} detik...

            </p>

        </div>

    );

}
