import { create } from "zustand";

export type MarketDialogMode = "create" | "edit";
export type ParticipantDialogMode = "create" | "edit";
export type ParticipantMasterDialogMode = "create" | "edit";

type DashboardDialogState = {
  editingMarketId: string | null;
  editingParticipantId: string | null;
  editingParticipantMasterId: string | null;
  marketDialogMode: MarketDialogMode | null;
  participantDialogMode: ParticipantDialogMode | null;
  participantFeeOverrideEnabled: boolean;
  participantMasterDialogMode: ParticipantMasterDialogMode | null;
  closeMarketDialog: () => void;
  closeParticipantDialog: () => void;
  closeParticipantMasterDialog: () => void;
  openCreateMarketDialog: () => void;
  openCreateParticipantDialog: () => void;
  openCreateParticipantMasterDialog: () => void;
  openEditMarketDialog: (marketId: string) => void;
  openEditParticipantDialog: (
    participantId: string,
    feeOverrideEnabled: boolean,
  ) => void;
  openEditParticipantMasterDialog: (participantId: string) => void;
  setParticipantFeeOverrideEnabled: (enabled: boolean) => void;
};

export const useDashboardDialogStore = create<DashboardDialogState>((set) => ({
  editingMarketId: null,
  editingParticipantId: null,
  editingParticipantMasterId: null,
  marketDialogMode: null,
  participantDialogMode: null,
  participantFeeOverrideEnabled: false,
  participantMasterDialogMode: null,
  closeMarketDialog: () =>
    set({
      editingMarketId: null,
      marketDialogMode: null,
    }),
  closeParticipantDialog: () =>
    set({
      editingParticipantId: null,
      participantDialogMode: null,
      participantFeeOverrideEnabled: false,
    }),
  closeParticipantMasterDialog: () =>
    set({
      editingParticipantMasterId: null,
      participantMasterDialogMode: null,
    }),
  openCreateMarketDialog: () =>
    set({
      editingMarketId: null,
      marketDialogMode: "create",
    }),
  openCreateParticipantDialog: () =>
    set({
      editingParticipantId: null,
      participantDialogMode: "create",
      participantFeeOverrideEnabled: false,
    }),
  openCreateParticipantMasterDialog: () =>
    set({
      editingParticipantMasterId: null,
      participantMasterDialogMode: "create",
    }),
  openEditMarketDialog: (marketId) =>
    set({
      editingMarketId: marketId,
      marketDialogMode: "edit",
    }),
  openEditParticipantDialog: (participantId, feeOverrideEnabled) =>
    set({
      editingParticipantId: participantId,
      participantDialogMode: "edit",
      participantFeeOverrideEnabled: feeOverrideEnabled,
    }),
  openEditParticipantMasterDialog: (participantId) =>
    set({
      editingParticipantMasterId: participantId,
      participantMasterDialogMode: "edit",
    }),
  setParticipantFeeOverrideEnabled: (enabled) =>
    set({ participantFeeOverrideEnabled: enabled }),
}));
