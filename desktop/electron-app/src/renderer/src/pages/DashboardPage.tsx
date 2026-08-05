import { useNavigate } from "react-router-dom";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import CardBody from "@/components/ui/CardBody";

import { useSessionStore } from "@/store/sessionStore";
import { useAuthStore } from "@/store/authStore";

export default function DashboardPage() {

    const navigate = useNavigate();

    const reset = useSessionStore((state) => state.reset);

    const user = useAuthStore((state) => state.user);

    function handleStart() {

        reset();

        navigate("/template");

    }

    return (

        <div className="flex h-full flex-col items-center justify-center gap-8 text-center">

            <div>

                <h1 className="text-4xl font-bold text-slate-800">

                    Selamat Datang{user?.name ? `, ${user.name}` : ""}!

                </h1>

                <p className="mt-2 text-lg text-slate-500">

                    Sentuh tombol di bawah untuk memulai sesi foto baru.

                </p>

            </div>

            <Button onClick={handleStart} className="px-10 py-4 text-xl">

                Mulai Sesi Foto

            </Button>

            <Card className="w-full max-w-md">

                <CardBody>

                    <p className="text-sm text-slate-500">

                        Mode kamera saat ini: <span className="font-semibold text-slate-700">Webcam</span>

                    </p>

                </CardBody>

            </Card>

        </div>

    );

}
