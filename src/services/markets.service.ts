import { apiRequest } from "./api-client";

export type MarketStatus = "draft" | "active" | "closed" | "archived";

export type Market = {
  id: string;
  name: string;
  description: string | null;
  status: MarketStatus;
  startsOn: string | null;
  endsOn: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateMarketPayload = {
  name: string;
  description?: string;
  startsOn?: string;
  endsOn?: string;
};

export type UpdateMarketPayload = Partial<CreateMarketPayload> & {
  status?: MarketStatus;
};

export async function listMarkets(): Promise<Market[]> {
  return apiRequest<Market[]>("/markets");
}

export async function createMarket(
  payload: CreateMarketPayload,
): Promise<Market> {
  return apiRequest<Market>("/markets", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateMarket(
  marketId: string,
  payload: UpdateMarketPayload,
): Promise<Market> {
  return apiRequest<Market>(`/markets/${marketId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
