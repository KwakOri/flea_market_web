"use client";

import { useSyncExternalStore } from "react";
import {
  getApiReadinessServerSnapshot,
  getApiReadinessState,
  subscribeToApiReadiness,
} from "@/services/api-client";

export function useApiReadiness() {
  return useSyncExternalStore(
    subscribeToApiReadiness,
    getApiReadinessState,
    getApiReadinessServerSnapshot,
  );
}
