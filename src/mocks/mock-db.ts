import type { AuditLog } from "@/services/audit-logs.service";
import type { AuthUser } from "@/services/auth.service";
import type { Market } from "@/services/markets.service";
import type { Invitation } from "@/services/invitations.service";
import type { Participant } from "@/services/participants.service";
import type { Product } from "@/services/products.service";
import type { Receipt } from "@/services/receipts.service";
import type { SettlementDefaultSettings } from "@/services/settlement-settings.service";
import type { Settlement } from "@/services/settlements.service";
import {
  mockAuditLogs,
  mockGlobalSettlementSettings,
  mockMarketParticipants,
  mockMarketSettlementSettings,
  mockMarkets,
  mockParticipantMasters,
  mockProducts,
  mockReceipts,
  mockSettlements,
  mockUser,
} from "@/mocks/fixtures";

const STORAGE_KEY = "flea-market:mock-db:v1";

export type MockDbState = {
  auditLogs: AuditLog[];
  counters: Record<string, number>;
  currentUser: AuthUser;
  isAuthenticated: boolean;
  signupInvitations: Invitation[];
  globalSettlementSettings: SettlementDefaultSettings;
  marketParticipants: Participant[];
  marketSettlementSettings: SettlementDefaultSettings[];
  markets: Market[];
  participantMasters: Participant[];
  products: Product[];
  receipts: Receipt[];
  settlements: Settlement[];
};

let memoryState: MockDbState | null = null;

export function getMockState(): MockDbState {
  if (memoryState) {
    return memoryState;
  }

  memoryState = loadStoredState() ?? createInitialState();
  return memoryState;
}

export function persistMockState() {
  if (!memoryState || !shouldPersistToLocalStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryState));
  } catch {
    // Persistence is optional. If the browser blocks storage, keep in-memory mode.
  }
}

export function resetMockState(): MockDbState {
  memoryState = createInitialState();
  persistMockState();
  return memoryState;
}

export function cloneMockData<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function createMockId(prefix: string): string {
  const state = getMockState();
  const nextValue = (state.counters[prefix] ?? 0) + 1;
  state.counters[prefix] = nextValue;
  return `mock-${prefix}-${String(nextValue).padStart(4, "0")}`;
}

export function nowIsoString(): string {
  return new Date().toISOString();
}

function createInitialState(): MockDbState {
  return {
    auditLogs: cloneMockData(mockAuditLogs),
    counters: {
      audit: 1000,
      market: 1000,
      marketParticipant: 1000,
      participant: 1000,
      payment: 1000,
      product: 1000,
      receipt: 1000,
      saleLine: 1000,
      saleLineItem: 1000,
      settlement: 1000,
      settlementChange: 1000,
      settlementParticipant: 1000,
      setting: 1000,
    },
    currentUser: cloneMockData(mockUser),
    isAuthenticated: true,
    signupInvitations: [],
    globalSettlementSettings: cloneMockData(mockGlobalSettlementSettings),
    marketParticipants: cloneMockData(mockMarketParticipants),
    marketSettlementSettings: cloneMockData(mockMarketSettlementSettings),
    markets: cloneMockData(mockMarkets),
    participantMasters: cloneMockData(mockParticipantMasters),
    products: cloneMockData(mockProducts),
    receipts: cloneMockData(mockReceipts),
    settlements: cloneMockData(mockSettlements),
  };
}

function loadStoredState(): MockDbState | null {
  if (!shouldPersistToLocalStorage()) {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);

    if (!rawValue) {
      return null;
    }

    const storedState = JSON.parse(rawValue) as MockDbState;

    return {
      ...storedState,
      isAuthenticated: storedState.isAuthenticated ?? true,
      signupInvitations: storedState.signupInvitations ?? [],
    };
  } catch {
    return null;
  }
}

function shouldPersistToLocalStorage(): boolean {
  return (
    typeof window !== "undefined" &&
    process.env.NEXT_PUBLIC_MOCK_PERSISTENCE !== "memory"
  );
}
