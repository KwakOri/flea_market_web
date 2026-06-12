"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createMarket,
  listMarkets,
  updateMarket,
  type CreateMarketPayload,
  type UpdateMarketPayload,
} from "@/services/markets.service";

export const marketKeys = {
  all: ["markets"] as const,
};

export function useMarkets(enabled: boolean) {
  return useQuery({
    queryKey: marketKeys.all,
    queryFn: listMarkets,
    enabled,
  });
}

export function useCreateMarket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateMarketPayload) => createMarket(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: marketKeys.all });
    },
  });
}

export function useUpdateMarket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      marketId,
      payload,
    }: {
      marketId: string;
      payload: UpdateMarketPayload;
    }) => updateMarket(marketId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: marketKeys.all });
    },
  });
}
