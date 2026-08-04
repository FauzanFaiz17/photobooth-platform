import { useEffect } from "react";

import { bootstrap } from "./bootstrap/bootstrap";

import AppRouter from "./routes/AppRouter";

export default function App() {

    useEffect(() => {

        bootstrap();

    }, []);

    return <AppRouter />;

}