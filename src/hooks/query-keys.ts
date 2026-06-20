export const authKeys = {
  me: ["auth", "me"] as const,
};

export const healthKeys = {
  status: ["health", "status"] as const,
};

export const marketKeys = {
  all: ["markets"] as const,
};

export const participantKeys = {
  masters: ["participants", "masters"] as const,
  masterDetail: (participantId: string) =>
    ["participants", "masters", participantId] as const,
  marketLists: ["participants", "by-market"] as const,
  byMarket: (marketId: string | null) =>
    ["participants", "by-market", marketId] as const,
};

export const productKeys = {
  marketParticipantLists: ["products", "by-market-participant"] as const,
  byMarketParticipant: (
    marketId: string | null,
    participantId: string | null,
  ) => ["products", "by-market-participant", marketId, participantId] as const,
};

export const receiptKeys = {
  marketLists: ["receipts", "by-market"] as const,
  byMarket: (marketId: string | null) =>
    ["receipts", "by-market", marketId] as const,
  detail: (receiptId: string | null) => ["receipts", "detail", receiptId] as const,
};

export const settlementPreviewKeys = {
  marketPreviews: ["settlement-previews", "by-market"] as const,
  byMarket: (marketId: string | null) =>
    ["settlement-previews", "by-market", marketId] as const,
};

export const settlementKeys = {
  marketLists: ["settlements", "by-market"] as const,
  byMarket: (marketId: string | null) =>
    ["settlements", "by-market", marketId] as const,
  detail: (settlementId: string | null) =>
    ["settlements", "detail", settlementId] as const,
};

export const settlementSettingsKeys = {
  global: ["settlement-settings", "global"] as const,
  marketSettings: ["settlement-settings", "market"] as const,
  market: (marketId: string | null) =>
    ["settlement-settings", "market", marketId] as const,
};
