import { create } from "zustand";

type DashboardUiState = {
  railOpen: boolean;
  closeRail: () => void;
  openRail: () => void;
  setRailOpen: (railOpen: boolean) => void;
};

export const useDashboardUiStore = create<DashboardUiState>((set) => ({
  railOpen: false,
  closeRail: () => set({ railOpen: false }),
  openRail: () => set({ railOpen: true }),
  setRailOpen: (railOpen) => set({ railOpen }),
}));
