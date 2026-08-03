import { HashRouter, Routes, Route } from "react-router-dom";

import AuthLayout from "../layouts/AuthLayout";
import BoothLayout from "../layouts/BoothLayout";

import SplashPage from "../pages/SplashPage";
import LoginPage from "../pages/LoginPage";
import DashboardPage from "../pages/DashboardPage";
import PaymentPage from "../pages/PaymentPage";
import TemplatePage from "../pages/TemplatePage";
import FilterPage from "../pages/FilterPage";
import CameraPage from "../pages/CameraPage";
import PreviewPage from "../pages/PreviewPage";
import FinishPage from "../pages/FinishPage";

export default function AppRouter() {

    return (

        <HashRouter>

            <Routes>

                <Route element={<AuthLayout />}>
                    <Route path="/" element={<SplashPage />} />
                    <Route path="/login" element={<LoginPage />} />
                </Route>

                <Route element={<BoothLayout />}>

                    <Route path="/dashboard" element={<DashboardPage />} />

                    <Route path="/payment" element={<PaymentPage />} />

                    <Route path="/template" element={<TemplatePage />} />

                    <Route path="/filter" element={<FilterPage />} />

                    <Route path="/camera" element={<CameraPage />} />

                    <Route path="/preview" element={<PreviewPage />} />

                    <Route path="/finish" element={<FinishPage />} />

                </Route>

            </Routes>

        </HashRouter>

    );

}