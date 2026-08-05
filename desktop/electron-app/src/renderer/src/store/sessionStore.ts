import { create } from "zustand";

import type { PhotoTemplate } from "@/features/template/types";
import type { PhotoFilter } from "@/features/filter/types";

export interface CapturedShot {
    id: string;
    dataUrl: string;
}

interface SessionState {

    template: PhotoTemplate | null;

    filter: PhotoFilter | null;

    shots: CapturedShot[];

    requiredShots: number;

    setTemplate: (template: PhotoTemplate) => void;

    setFilter: (filter: PhotoFilter | null) => void;

    addShot: (shot: CapturedShot) => void;

    resetShots: () => void;

    reset: () => void;
}

const DEFAULT_REQUIRED_SHOTS = 4;

export const useSessionStore = create<SessionState>((set) => ({

    template: null,

    filter: null,

    shots: [],

    requiredShots: DEFAULT_REQUIRED_SHOTS,

    setTemplate: (template) =>
        set({
            template,
            requiredShots: template.slots ?? DEFAULT_REQUIRED_SHOTS,
        }),

    setFilter: (filter) => set({ filter }),

    addShot: (shot) =>
        set((state) => ({
            shots: [...state.shots, shot],
        })),

    resetShots: () => set({ shots: [] }),

    reset: () =>
        set({
            template: null,
            filter: null,
            shots: [],
            requiredShots: DEFAULT_REQUIRED_SHOTS,
        }),

}));
