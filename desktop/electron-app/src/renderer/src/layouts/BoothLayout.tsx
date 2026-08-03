import { Outlet } from "react-router-dom";

export default function BoothLayout() {
    return (
        <div className="h-screen flex flex-col">

            <header className="bg-slate-900 text-white p-4 flex justify-between">
                <div>Photobooth</div>

                <div>
                    Booth A
                </div>
            </header>

            <main className="flex-1 overflow-auto bg-gray-100 p-6">
                <Outlet />
            </main>

            <footer className="bg-white border-t p-3 text-sm text-gray-600">
                Camera : Offline
            </footer>

        </div>
    );
}