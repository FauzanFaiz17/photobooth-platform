import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import Button from "@/components/ui/Button";

import { useSessionStore } from "@/store/sessionStore";

export default function PreviewPage() {

    const navigate = useNavigate();

    const template = useSessionStore((state) => state.template);

    const shots = useSessionStore((state) => state.shots);

    const resetShots = useSessionStore((state) => state.resetShots);

    useEffect(() => {

        if (!template || shots.length === 0) {

            navigate("/camera", { replace: true });

        }

    }, [template, shots.length, navigate]);

    function handleRetake() {

        resetShots();

        navigate("/camera");

    }

    function handleConfirm() {

        // NOTE: alur pembayaran (PaymentPage) sengaja dilewati dulu sesuai
        // urutan yang diminta (Dashboard -> Template -> Filter -> Camera ->
        // Preview -> Finish). Tinggal sisipkan navigate("/payment") di sini
        // kapan pun alur pembayaran siap diimplementasikan.
        navigate("/finish");

    }

    if (!template || shots.length === 0) {

        return null;

    }

    return (

        <div className="flex h-full flex-col gap-6">

            <div>

                <h1 className="text-2xl font-bold text-slate-800">Preview Hasil Foto</h1>

                <p className="text-slate-500">Template: {template.name}</p>

            </div>

            <div
                className={`grid gap-4 ${
                    template.layout === "strip" ? "grid-cols-1 max-w-sm" : "grid-cols-2 max-w-lg"
                }`}
            >

                {shots.map((shot, index) => (

                    <img
                        key={shot.id}
                        src={shot.dataUrl}
                        alt={`Foto ${index + 1}`}
                        className="w-full rounded-lg border border-slate-200 shadow-sm"
                    />

                ))}

            </div>

            <div className="mt-auto flex gap-4">

                <Button
                    onClick={handleRetake}
                    className="bg-slate-500 hover:bg-slate-600"
                >

                    Ambil Ulang

                </Button>

                <Button onClick={handleConfirm}>

                    Lanjutkan

                </Button>

            </div>

        </div>

    );

}
