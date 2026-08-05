import type { PhotoFilter } from "./types";

// TODO: ganti dengan panggilan ke GET /v1/filters begitu endpoint-nya
// tersedia di backend (Model & migration sudah ada, tapi route API-nya
// belum di-daftarkan di backend/routes/api.php).
export const mockFilters: PhotoFilter[] = [
    {
        id: "none",
        name: "Original",
        cssFilter: "none",
    },
    {
        id: "bw",
        name: "Hitam Putih",
        cssFilter: "grayscale(1) contrast(1.1)",
    },
    {
        id: "warm",
        name: "Warm",
        cssFilter: "sepia(0.35) saturate(1.3) brightness(1.05)",
    },
    {
        id: "cool",
        name: "Cool",
        cssFilter: "saturate(1.2) hue-rotate(180deg) brightness(1.05)",
    },
    {
        id: "vintage",
        name: "Vintage",
        cssFilter: "sepia(0.5) contrast(0.9) brightness(0.95) saturate(0.8)",
    },
];
