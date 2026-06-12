import { apiRequest } from "./api-client";

export type HealthResponse = {
  status: string;
  service: string;
};

export async function getHealth(): Promise<HealthResponse> {
  return apiRequest<HealthResponse>("/health");
}
