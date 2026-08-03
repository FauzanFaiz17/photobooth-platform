import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { storage } from "../services/storage";

export default function SplashPage() {

    const navigate = useNavigate();

    useEffect(() => {

        async function checkLogin() {

            const token = await storage.get("token");

            if (!token) {

                navigate("/login");

                return;
            }

            navigate("/dashboard");

        }

        checkLogin();

    }, []);

    return (

        <div className="flex h-screen items-center justify-center">

            <h1 className="text-3xl font-bold">

                Photobooth

            </h1>

        </div>

    );

}