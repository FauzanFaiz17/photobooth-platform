export interface PhotoFilter {
    id: string;
    name: string;
    /** CSS filter string, langsung dipakai di style={{ filter: cssFilter }} */
    cssFilter: string;
}
