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
    <>
      <div className="grid gap-3 md:hidden">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            onStatusChange={onStatusChange}
            product={product}
          />
        ))}
      </div>
      <div className="hidden min-w-0 max-w-full overflow-x-auto md:block">
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
                <td className="px-4 py-3 text-zinc-600">
                  {product.sku ?? "-"}
                </td>
                <td className="px-4 py-3 text-right font-medium text-zinc-950">
                  {formatWon(product.priceAmount)}
                </td>
                <td className="px-4 py-3">
                  <ProductStatusSelect
                    onStatusChange={onStatusChange}
                    product={product}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function ProductCard({
  onStatusChange,
  product,
}: {
  onStatusChange: (productId: string, status: ProductStatus) => void;
  product: Product;
}) {
  return (
    <article
      className="grid gap-3 rounded-[14px] border border-[#e6e2d4] bg-white p-4"
      data-testid="product-card"
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-semibold text-[#181a12]">
            {product.name}
          </h3>
          <p className="mt-1 font-mono text-[10.5px] text-[#8a8775]">
            {product.sku ?? "SKU 없음"}
          </p>
        </div>
        <p className="shrink-0 font-display text-[16px] font-bold text-[#181a12]">
          {formatWon(product.priceAmount)}
        </p>
      </div>
      <ProductStatusSelect onStatusChange={onStatusChange} product={product} />
    </article>
  );
}

function ProductStatusSelect({
  onStatusChange,
  product,
}: {
  onStatusChange: (productId: string, status: ProductStatus) => void;
  product: Product;
}) {
  return (
    <select
      className={compactSelectClass}
      onChange={(event) =>
        onStatusChange(product.id, event.target.value as ProductStatus)
      }
      value={product.status}
    >
      {Object.entries(productStatusLabels).map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  );
}
