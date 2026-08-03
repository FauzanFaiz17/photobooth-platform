import { Outlet } from "react-router-dom";

export default function AuthLayout() {
    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center">
            <div className="w-full max-w-md rounded-xl bg-white shadow-xl p-8">
                <Outlet />
            </div>
        </div>
    );
}