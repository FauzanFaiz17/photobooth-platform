import type { PhotoTemplate } from "./types";

// TODO: ganti dengan panggilan ke GET /v1/templates begitu endpoint-nya
// tersedia di backend (Model & migration sudah ada, tapi route API-nya
// belum di-daftarkan di backend/routes/api.php).
export const mockTemplates: PhotoTemplate[] = [
    {
        id: "strip-classic",
        name: "Strip Klasik (4 foto)",
        slots: 4,
        previewColor: "#1f2937",
        layout: "strip",
    },
    {
        id: "grid-2x2",
        name: "Grid 2x2",
        slots: 4,
        previewColor: "#7c3aed",
        layout: "grid",
    },
    {
        id: "strip-mini",
        name: "Strip Mini (3 foto)",
        slots: 3,
        previewColor: "#0891b2",
        layout: "strip",
    },
    {
        id: "single-frame",
        name: "Single Frame",
        slots: 1,
        previewColor: "#dc2626",
        layout: "grid",
    },
];
