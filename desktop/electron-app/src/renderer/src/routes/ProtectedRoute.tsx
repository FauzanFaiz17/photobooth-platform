import { Navigate, Outlet } from "react-router-dom";

import { useAuthStore } from "@/store/authStore";

export default function ProtectedRoute() {

    const authenticated = useAuthStore(

        (state) => state.authenticated

    );

    if (!authenticated) {

        return <Navigate to="/login" replace />;

    }

    return <Outlet />;

}