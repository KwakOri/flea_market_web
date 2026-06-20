"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createMarket,
  listMarkets,
  updateMarket,
  type CreateMarketPayload,
  type UpdateMarketPayload,
} from "@/services/markets.service";
import { invalidateMarkets } from "@/hooks/query-invalidations";
import { marketKeys } from "@/hooks/query-keys";

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
      void invalidateMarkets(queryClient);
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
      void invalidateMarkets(queryClient);
    },
  });
}
