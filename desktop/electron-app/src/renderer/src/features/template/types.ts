export interface PhotoTemplate {
    id: string;
    name: string;
    /** jumlah foto yang dibutuhkan untuk mengisi layout template ini */
    slots: number;
    /** warna preview sederhana, sebelum ada asset asli dari backend */
    previewColor: string;
    layout: "strip" | "grid";
}
