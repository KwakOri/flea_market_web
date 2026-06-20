import type { ProductStatus } from "@/services/products.service";

export const productStatusLabels: Record<ProductStatus, string> = {
  active: "판매",
  inactive: "중지",
};
