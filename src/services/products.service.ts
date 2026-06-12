import { apiRequest } from "./api-client";

export type ProductStatus = "active" | "inactive";

export type Product = {
  id: string;
  marketId: string;
  participantId: string | null;
  name: string;
  sku: string | null;
  priceAmount: number;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
};

export type CreateProductPayload = {
  name: string;
  sku?: string;
  priceAmount: number;
  status?: ProductStatus;
};

export type UpdateProductPayload = Partial<CreateProductPayload>;

export async function listProducts(
  participantId: string,
): Promise<Product[]> {
  return apiRequest<Product[]>(`/participants/${participantId}/products`);
}

export async function createProduct(
  participantId: string,
  payload: CreateProductPayload,
): Promise<Product> {
  return apiRequest<Product>(`/participants/${participantId}/products`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateProduct(
  productId: string,
  payload: UpdateProductPayload,
): Promise<Product> {
  return apiRequest<Product>(`/products/${productId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
