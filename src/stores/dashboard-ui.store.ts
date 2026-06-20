import { create } from "zustand";
import type { MarketLifecycleFilter } from "@/features/markets/lib/market-display";

type ParticipantIdSetter =
  | string
  | null
  | ((currentParticipantId: string | null) => string | null);

type DashboardUiState = {
  marketLifecycleFilter: MarketLifecycleFilter;
  railOpen: boolean;
  requestedParticipantId: string | null;
  closeRail: () => void;
  openRail: () => void;
  setMarketLifecycleFilter: (marketLifecycleFilter: MarketLifecycleFilter) => void;
  setRailOpen: (railOpen: boolean) => void;
  setRequestedParticipantId: (participantId: ParticipantIdSetter) => void;
};

export const useDashboardUiStore = create<DashboardUiState>((set) => ({
  marketLifecycleFilter: "active",
  railOpen: false,
  requestedParticipantId: null,
  closeRail: () => set({ railOpen: false }),
  openRail: () => set({ railOpen: true }),
  setMarketLifecycleFilter: (marketLifecycleFilter) =>
    set({ marketLifecycleFilter }),
  setRailOpen: (railOpen) => set({ railOpen }),
  setRequestedParticipantId: (participantId) =>
    set((state) => ({
      requestedParticipantId:
        typeof participantId === "function"
          ? participantId(state.requestedParticipantId)
          : participantId,
    })),
}));
