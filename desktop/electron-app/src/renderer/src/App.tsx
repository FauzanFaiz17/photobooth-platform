import AppRouter from "./routes/AppRouter";

export default function App() {

    // Proses autentikasi, device, dan bootstrap data dilakukan
    // di SplashPage (route "/"), karena UI perlu menunggu hasilnya
    // sebelum memutuskan halaman tujuan (login vs dashboard).
    return <AppRouter />;

}