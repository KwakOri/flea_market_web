import type { Product, ProductStatus } from "@/services/products.service";
import { productStatusLabels } from "@/features/products/lib/product-display";
import { compactSelectClass } from "@/lib/design-system";
import { formatWon } from "@/lib/money";

export function ProductTable({
  products,
  onStatusChange,
}: {
  products: Product[];
  onStatusChange: (productId: string, status: ProductStatus) => void;
}) {
  if (products.length === 0) {
    return (
      <div className="px-4 py-12 text-center text-sm text-zinc-500">
        등록된 상품이 없습니다.
      </div>
    );
  }

  return (
    <div className="min-w-0 max-w-full overflow-x-auto">
      <table className="w-full min-w-[760px] border-collapse text-sm">
        <thead className="bg-zinc-50 text-left text-zinc-500">
          <tr>
            <th className="px-4 py-3 font-medium">상품명</th>
            <th className="px-4 py-3 font-medium">SKU</th>
            <th className="px-4 py-3 text-right font-medium">가격</th>
            <th className="px-4 py-3 font-medium">상태</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {products.map((product) => (
            <tr data-testid="product-row" key={product.id}>
              <td className="px-4 py-3 font-medium text-zinc-950">
                {product.name}
              </td>
              <td className="px-4 py-3 text-zinc-600">{product.sku ?? "-"}</td>
              <td className="px-4 py-3 text-right font-medium text-zinc-950">
                {formatWon(product.priceAmount)}
              </td>
              <td className="px-4 py-3">
                <select
                  className={compactSelectClass}
                  onChange={(event) =>
                    onStatusChange(
                      product.id,
                      event.target.value as ProductStatus,
                    )
                  }
                  value={product.status}
                >
                  {Object.entries(productStatusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
