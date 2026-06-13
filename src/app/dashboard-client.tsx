"use client";

import { FormEvent, useMemo, useState } from "react";
import { cva } from "class-variance-authority";
import {
  useCurrentUser,
  useLogin,
  useLogout,
  useRegister,
} from "@/hooks/use-auth";
import {
  useCreateMarket,
  useMarkets,
  useUpdateMarket,
} from "@/hooks/use-markets";
import {
  useCreateParticipant,
  useParticipants,
} from "@/hooks/use-participants";
import {
  useCreateProduct,
  useProducts,
  useUpdateProduct,
} from "@/hooks/use-products";
import { useCreateReceipt, useReceipts } from "@/hooks/use-receipts";
import { ApiError } from "@/services/api-client";
import type { Market, MarketStatus } from "@/services/markets.service";
import type {
  Participant,
  ParticipantType,
} from "@/services/participants.service";
import type { Product, ProductStatus } from "@/services/products.service";
import type { PaymentMethod, Receipt } from "@/services/receipts.service";
import { cn } from "@/lib/utils";

const buttonClass = cva(
  "inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      intent: {
        primary: "bg-zinc-950 text-white hover:bg-zinc-800",
        secondary:
          "border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50",
        quiet: "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950",
      },
    },
    defaultVariants: {
      intent: "primary",
    },
  },
);

const inputClass =
  "h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";

const selectClass =
  "h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";

const marketStatusLabels: Record<MarketStatus, string> = {
  draft: "준비",
  active: "운영",
  closed: "종료",
  archived: "보관",
};

const participantTypeLabels: Record<ParticipantType, string> = {
  staff: "운영진",
  seller: "셀러",
  special_booth: "특수 부스",
};

const productStatusLabels: Record<ProductStatus, string> = {
  active: "판매",
  inactive: "중지",
};

const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: "현금",
  card: "카드",
  transfer: "계좌이체",
  other: "기타",
};

export function DashboardClient() {
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [marketMessage, setMarketMessage] = useState<string | null>(null);
  const [participantMessage, setParticipantMessage] = useState<string | null>(
    null,
  );
  const [productMessage, setProductMessage] = useState<string | null>(null);
  const [receiptMessage, setReceiptMessage] = useState<string | null>(null);
  const [requestedMarketId, setRequestedMarketId] = useState<string | null>(
    null,
  );
  const [requestedParticipantId, setRequestedParticipantId] = useState<
    string | null
  >(null);

  const currentUser = useCurrentUser();
  const user = currentUser.data ?? null;
  const markets = useMarkets(Boolean(user));
  const selectedMarketId = useMemo(() => {
    if (!markets.data?.length) {
      return null;
    }

    const requestedMarket = markets.data.find(
      (market) => market.id === requestedMarketId,
    );

    return requestedMarket?.id ?? markets.data[0].id;
  }, [markets.data, requestedMarketId]);
  const createMarket = useCreateMarket();
  const updateMarket = useUpdateMarket();
  const participants = useParticipants(selectedMarketId);
  const selectedParticipantId = useMemo(() => {
    if (!participants.data?.length) {
      return null;
    }

    const requestedParticipant = participants.data.find(
      (participant) => participant.id === requestedParticipantId,
    );

    return requestedParticipant?.id ?? participants.data[0].id;
  }, [participants.data, requestedParticipantId]);
  const createParticipant = useCreateParticipant(selectedMarketId);
  const products = useProducts(selectedParticipantId);
  const createProduct = useCreateProduct(selectedParticipantId);
  const updateProduct = useUpdateProduct(selectedParticipantId);
  const receipts = useReceipts(selectedMarketId);
  const createReceipt = useCreateReceipt(selectedMarketId);
  const login = useLogin();
  const register = useRegister();
  const logout = useLogout();

  const selectedMarket = useMemo(
    () =>
      markets.data?.find((market) => market.id === selectedMarketId) ?? null,
    [markets.data, selectedMarketId],
  );
  const selectedParticipant = useMemo(
    () =>
      participants.data?.find(
        (participant) => participant.id === selectedParticipantId,
      ) ?? null,
    [participants.data, selectedParticipantId],
  );

  const summary = [
    { label: "마켓", value: String(markets.data?.length ?? 0) },
    { label: "참가자", value: String(participants.data?.length ?? 0) },
    { label: "상품", value: String(products.data?.length ?? 0) },
    { label: "영수증", value: String(receipts.data?.length ?? 0) },
    { label: "운영 중", value: countMarketsByStatus(markets.data, "active") },
  ];

  async function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthMessage(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = getFormString(formData, "email");
    const password = getFormString(formData, "password");
    const displayName = getFormString(formData, "displayName");

    try {
      if (authMode === "login") {
        await login.mutateAsync({ email, password });
      } else {
        await register.mutateAsync({ email, password, displayName });
      }

      form.reset();
    } catch (error) {
      setAuthMessage(getErrorMessage(error));
    }
  }

  async function handleLogout() {
    setAuthMessage(null);
    await logout.mutateAsync();
    setRequestedMarketId(null);
    setRequestedParticipantId(null);
  }

  async function handleCreateMarket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMarketMessage(null);

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const market = await createMarket.mutateAsync({
        name: getFormString(formData, "name"),
        description: getOptionalFormString(formData, "description"),
        startsOn: getOptionalFormString(formData, "startsOn"),
        endsOn: getOptionalFormString(formData, "endsOn"),
      });

      setRequestedMarketId(market.id);
      setRequestedParticipantId(null);
      form.reset();
    } catch (error) {
      setMarketMessage(getErrorMessage(error));
    }
  }

  async function handleMarketStatusChange(
    marketId: string,
    status: MarketStatus,
  ) {
    setMarketMessage(null);

    try {
      await updateMarket.mutateAsync({
        marketId,
        payload: { status },
      });
    } catch (error) {
      setMarketMessage(getErrorMessage(error));
    }
  }

  async function handleCreateParticipant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setParticipantMessage(null);

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const participant = await createParticipant.mutateAsync({
        displayName: getFormString(formData, "displayName"),
        participantType: getFormString(formData, "participantType") as ParticipantType,
        salesCommissionRate: getPercentRate(formData, "salesCommissionPercent"),
        cardFeeRate: getPercentRate(formData, "cardFeePercent"),
        cardFeePayer: getFormString(formData, "cardFeePayer") as
          | "market"
          | "participant",
        participationFeeAmount: getNumber(formData, "participationFeeAmount"),
      });

      setRequestedParticipantId(participant.id);
      form.reset();
    } catch (error) {
      setParticipantMessage(getErrorMessage(error));
    }
  }

  async function handleCreateProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProductMessage(null);

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      await createProduct.mutateAsync({
        name: getFormString(formData, "name"),
        sku: getOptionalFormString(formData, "sku"),
        priceAmount: getRequiredNumber(
          formData,
          "priceAmount",
          "가격을 입력해주세요.",
        ),
      });

      form.reset();
    } catch (error) {
      setProductMessage(getErrorMessage(error));
    }
  }

  async function handleProductStatusChange(
    productId: string,
    status: ProductStatus,
  ) {
    setProductMessage(null);

    try {
      await updateProduct.mutateAsync({
        productId,
        payload: { status },
      });
    } catch (error) {
      setProductMessage(getErrorMessage(error));
    }
  }

  async function handleCreateReceipt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setReceiptMessage(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const participantId =
      getFormString(formData, "participantId") || selectedParticipantId;
    const totalAmount = getRequiredNumber(
      formData,
      "totalAmount",
      "금액을 입력해주세요.",
    );

    if (!participantId) {
      setReceiptMessage("참가자를 선택해주세요.");
      return;
    }

    try {
      await createReceipt.mutateAsync({
        customerLabel: getOptionalFormString(formData, "customerLabel"),
        memo: getOptionalFormString(formData, "memo"),
        paymentSplits: [
          {
            paymentMethod: getFormString(
              formData,
              "paymentMethod",
            ) as PaymentMethod,
            amount: totalAmount,
          },
        ],
        saleLines: [
          {
            participantId,
            items: [
              {
                itemName: getFormString(formData, "itemName"),
                quantity: 1,
                unitPriceAmount: totalAmount,
              },
            ],
          },
        ],
      });

      form.reset();
    } catch (error) {
      setReceiptMessage(getErrorMessage(error));
    }
  }

  return (
    <main className="min-h-screen bg-zinc-100 text-zinc-950">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6">
        <header className="flex flex-col gap-4 border-b border-zinc-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-700">
              Flea Market Settlement
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-zinc-950">
              플리마켓 운영 대시보드
            </h1>
          </div>

          <section className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm lg:min-w-[520px]">
            {user ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-zinc-950">
                    {user.displayName}
                  </p>
                  <p className="text-xs text-zinc-500" data-testid="user-email">
                    {user.email}
                  </p>
                </div>
                <button
                  className={buttonClass({ intent: "secondary" })}
                  disabled={logout.isPending}
                  onClick={handleLogout}
                  type="button"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <form
                className="grid gap-3"
                data-testid="auth-form"
                onSubmit={handleAuthSubmit}
              >
                <div className="flex gap-2">
                  <button
                    className={buttonClass({
                      intent: authMode === "login" ? "primary" : "secondary",
                    })}
                    data-testid="auth-mode-login"
                    onClick={() => setAuthMode("login")}
                    type="button"
                  >
                    로그인
                  </button>
                  <button
                    className={buttonClass({
                      intent: authMode === "register" ? "primary" : "secondary",
                    })}
                    data-testid="auth-mode-register"
                    onClick={() => setAuthMode("register")}
                    type="button"
                  >
                    계정 생성
                  </button>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  {authMode === "register" && (
                    <input
                      className={inputClass}
                      name="displayName"
                      placeholder="이름"
                      type="text"
                    />
                  )}
                  <input
                    className={inputClass}
                    name="email"
                    placeholder="email@example.com"
                    type="email"
                  />
                  <input
                    className={inputClass}
                    name="password"
                    placeholder="비밀번호"
                    type="password"
                  />
                  <button
                    className={buttonClass()}
                    data-testid="auth-submit"
                    disabled={login.isPending || register.isPending}
                    type="submit"
                  >
                    {authMode === "login" ? "로그인" : "생성"}
                  </button>
                </div>
                {authMessage && (
                  <p className="text-sm font-medium text-red-700">
                    {authMessage}
                  </p>
                )}
              </form>
            )}
          </section>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {summary.map((item) => (
            <div
              className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm"
              key={item.label}
            >
              <p className="text-sm font-medium text-zinc-500">
                {item.label}
              </p>
              <p className="mt-2 text-2xl font-semibold text-zinc-950">
                {item.value}
              </p>
            </div>
          ))}
        </section>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="rounded-lg border border-zinc-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-zinc-200 px-4 py-3 md:flex-row md:items-center md:justify-between">
              <h2 className="text-base font-semibold text-zinc-950">마켓</h2>
              <form
                className="grid gap-2 md:grid-cols-[180px_160px_160px_1fr_auto]"
                data-testid="market-form"
                onSubmit={handleCreateMarket}
              >
                <input
                  className={inputClass}
                  disabled={!user}
                  name="name"
                  placeholder="마켓명"
                  type="text"
                />
                <input
                  className={inputClass}
                  disabled={!user}
                  name="startsOn"
                  type="date"
                />
                <input
                  className={inputClass}
                  disabled={!user}
                  name="endsOn"
                  type="date"
                />
                <input
                  className={inputClass}
                  disabled={!user}
                  name="description"
                  placeholder="메모"
                  type="text"
                />
                <button
                  className={buttonClass()}
                  disabled={!user || createMarket.isPending}
                  type="submit"
                >
                  추가
                </button>
              </form>
            </div>
            {marketMessage && (
              <p className="border-b border-zinc-200 px-4 py-2 text-sm font-medium text-red-700">
                {marketMessage}
              </p>
            )}
            <MarketTable
              markets={markets.data ?? []}
              selectedMarketId={selectedMarketId}
              onSelectMarket={(marketId) => {
                setRequestedMarketId(marketId);
                setRequestedParticipantId(null);
              }}
              onStatusChange={handleMarketStatusChange}
            />
          </div>

          <aside className="rounded-lg border border-zinc-200 bg-white shadow-sm">
            <div className="border-b border-zinc-200 px-4 py-3">
              <h2 className="text-base font-semibold text-zinc-950">
                참가자
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                {selectedMarket?.name ?? "마켓 미선택"}
              </p>
            </div>
            <form
              className="grid gap-3 p-4"
              data-testid="participant-form"
              onSubmit={handleCreateParticipant}
            >
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                <input
                  className={inputClass}
                  disabled={!selectedMarket}
                  name="displayName"
                  placeholder="참가자명"
                  type="text"
                />
                <select
                  className={selectClass}
                  defaultValue="seller"
                  disabled={!selectedMarket}
                  name="participantType"
                >
                  <option value="seller">셀러</option>
                  <option value="staff">운영진</option>
                  <option value="special_booth">특수 부스</option>
                </select>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  className={inputClass}
                  disabled={!selectedMarket}
                  min="0"
                  name="salesCommissionPercent"
                  placeholder="판매 수수료 %"
                  step="0.01"
                  type="number"
                />
                <input
                  className={inputClass}
                  disabled={!selectedMarket}
                  min="0"
                  name="cardFeePercent"
                  placeholder="카드 수수료 %"
                  step="0.01"
                  type="number"
                />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <select
                  className={selectClass}
                  defaultValue="market"
                  disabled={!selectedMarket}
                  name="cardFeePayer"
                >
                  <option value="market">마켓 부담</option>
                  <option value="participant">참가자 부담</option>
                </select>
                <input
                  className={inputClass}
                  disabled={!selectedMarket}
                  min="0"
                  name="participationFeeAmount"
                  placeholder="참가비"
                  step="1"
                  type="number"
                />
              </div>
              <button
                className={buttonClass()}
                disabled={!selectedMarket || createParticipant.isPending}
                type="submit"
              >
                참가자 추가
              </button>
              {participantMessage && (
                <p className="text-sm font-medium text-red-700">
                  {participantMessage}
                </p>
              )}
            </form>
            <ParticipantList
              participants={participants.data ?? []}
              selectedParticipantId={selectedParticipantId}
              onSelectParticipant={setRequestedParticipantId}
            />
          </aside>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-zinc-200 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-base font-semibold text-zinc-950">상품</h2>
              <p className="mt-1 text-sm text-zinc-500">
                {selectedParticipant
                  ? `${selectedMarket?.name ?? "마켓"} / ${selectedParticipant.displayName}`
                  : "참가자 미선택"}
              </p>
            </div>
            <form
              className="grid gap-2 lg:grid-cols-[200px_220px_160px_140px_auto]"
              data-testid="product-form"
              onSubmit={handleCreateProduct}
            >
              <select
                className={selectClass}
                disabled={!participants.data?.length}
                onChange={(event) =>
                  setRequestedParticipantId(event.target.value || null)
                }
                value={selectedParticipantId ?? ""}
              >
                <option value="">참가자 선택</option>
                {(participants.data ?? []).map((participant) => (
                  <option key={participant.id} value={participant.id}>
                    {participant.displayName}
                  </option>
                ))}
              </select>
              <input
                className={inputClass}
                disabled={!selectedParticipant}
                name="name"
                placeholder="상품명"
                type="text"
              />
              <input
                className={inputClass}
                disabled={!selectedParticipant}
                name="sku"
                placeholder="SKU"
                type="text"
              />
              <input
                className={inputClass}
                disabled={!selectedParticipant}
                min="0"
                name="priceAmount"
                placeholder="가격"
                step="1"
                type="number"
              />
              <button
                className={buttonClass()}
                disabled={!selectedParticipant || createProduct.isPending}
                type="submit"
              >
                상품 추가
              </button>
            </form>
          </div>
          {productMessage && (
            <p className="border-b border-zinc-200 px-4 py-2 text-sm font-medium text-red-700">
              {productMessage}
            </p>
          )}
          <ProductTable
            products={products.data ?? []}
            onStatusChange={handleProductStatusChange}
          />
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-zinc-200 px-4 py-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-base font-semibold text-zinc-950">영수증</h2>
              <p className="mt-1 text-sm text-zinc-500">
                {selectedMarket?.name ?? "마켓 미선택"}
              </p>
            </div>
            <form
              className="grid gap-2 xl:grid-cols-[180px_180px_220px_150px_150px_1fr_auto]"
              data-testid="receipt-form"
              onSubmit={handleCreateReceipt}
            >
              <select
                className={selectClass}
                disabled={!participants.data?.length}
                name="participantId"
                onChange={(event) =>
                  setRequestedParticipantId(event.target.value || null)
                }
                value={selectedParticipantId ?? ""}
              >
                <option value="">참가자 선택</option>
                {(participants.data ?? []).map((participant) => (
                  <option key={participant.id} value={participant.id}>
                    {participant.displayName}
                  </option>
                ))}
              </select>
              <input
                className={inputClass}
                disabled={!selectedParticipant}
                name="customerLabel"
                placeholder="구매자"
                type="text"
              />
              <input
                className={inputClass}
                disabled={!selectedParticipant}
                name="itemName"
                placeholder="판매 항목"
                type="text"
              />
              <input
                className={inputClass}
                disabled={!selectedParticipant}
                min="0"
                name="totalAmount"
                placeholder="금액"
                step="1"
                type="number"
              />
              <select
                className={selectClass}
                defaultValue="cash"
                disabled={!selectedParticipant}
                name="paymentMethod"
              >
                {Object.entries(paymentMethodLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <input
                className={inputClass}
                disabled={!selectedParticipant}
                name="memo"
                placeholder="메모"
                type="text"
              />
              <button
                className={buttonClass()}
                disabled={!selectedParticipant || createReceipt.isPending}
                type="submit"
              >
                영수증 추가
              </button>
            </form>
          </div>
          {receiptMessage && (
            <p className="border-b border-zinc-200 px-4 py-2 text-sm font-medium text-red-700">
              {receiptMessage}
            </p>
          )}
          <ReceiptTable
            participants={participants.data ?? []}
            receipts={receipts.data ?? []}
          />
        </section>
      </div>
    </main>
  );
}

function MarketTable({
  markets,
  selectedMarketId,
  onSelectMarket,
  onStatusChange,
}: {
  markets: Market[];
  selectedMarketId: string | null;
  onSelectMarket: (marketId: string) => void;
  onStatusChange: (marketId: string, status: MarketStatus) => void;
}) {
  if (markets.length === 0) {
    return (
      <div className="px-4 py-12 text-center text-sm text-zinc-500">
        등록된 마켓이 없습니다.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] border-collapse text-sm">
        <thead className="bg-zinc-50 text-left text-zinc-500">
          <tr>
            <th className="px-4 py-3 font-medium">마켓명</th>
            <th className="px-4 py-3 font-medium">기간</th>
            <th className="px-4 py-3 font-medium">상태</th>
            <th className="px-4 py-3 font-medium">메모</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {markets.map((market) => (
            <tr
              className={cn(
                "cursor-pointer transition hover:bg-emerald-50/50",
                selectedMarketId === market.id && "bg-emerald-50",
              )}
              data-testid="market-row"
              key={market.id}
              onClick={() => onSelectMarket(market.id)}
            >
              <td className="px-4 py-3 font-medium text-zinc-950">
                {market.name}
              </td>
              <td className="px-4 py-3 text-zinc-700">
                {formatDateRange(market.startsOn, market.endsOn)}
              </td>
              <td className="px-4 py-3">
                <select
                  className="h-8 rounded-md border border-zinc-300 bg-white px-2 text-sm text-zinc-800"
                  onChange={(event) =>
                    onStatusChange(market.id, event.target.value as MarketStatus)
                  }
                  onClick={(event) => event.stopPropagation()}
                  value={market.status}
                >
                  {Object.entries(marketStatusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </td>
              <td className="max-w-[260px] truncate px-4 py-3 text-zinc-600">
                {market.description ?? "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ParticipantList({
  participants,
  selectedParticipantId,
  onSelectParticipant,
}: {
  participants: Participant[];
  selectedParticipantId: string | null;
  onSelectParticipant: (participantId: string) => void;
}) {
  if (participants.length === 0) {
    return (
      <div className="border-t border-zinc-200 px-4 py-10 text-center text-sm text-zinc-500">
        등록된 참가자가 없습니다.
      </div>
    );
  }

  return (
    <div
      className="divide-y divide-zinc-100 border-t border-zinc-200"
      data-testid="participant-list"
    >
      {participants.map((participant) => (
        <button
          className={cn(
            "w-full px-4 py-3 text-left transition hover:bg-emerald-50/50",
            selectedParticipantId === participant.id && "bg-emerald-50",
          )}
          data-testid="participant-row"
          key={participant.id}
          onClick={() => onSelectParticipant(participant.id)}
          type="button"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium text-zinc-950">
                {participant.displayName}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                {participantTypeLabels[participant.participantType]}
              </p>
            </div>
            <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
              {formatPercent(participant.settings?.salesCommissionRate ?? 0)}
            </span>
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div>
              <dt className="text-zinc-500">카드 수수료</dt>
              <dd className="mt-1 font-medium text-zinc-800">
                {formatPercent(participant.settings?.cardFeeRate ?? 0)}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">참가비</dt>
              <dd className="mt-1 font-medium text-zinc-800">
                {formatWon(participant.settings?.participationFeeAmount ?? 0)}
              </dd>
            </div>
          </dl>
        </button>
      ))}
    </div>
  );
}

function ProductTable({
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
    <div className="overflow-x-auto">
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
                <select
                  className="h-8 rounded-md border border-zinc-300 bg-white px-2 text-sm text-zinc-800"
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReceiptTable({
  receipts,
  participants,
}: {
  receipts: Receipt[];
  participants: Participant[];
}) {
  if (receipts.length === 0) {
    return (
      <div className="px-4 py-12 text-center text-sm text-zinc-500">
        등록된 영수증이 없습니다.
      </div>
    );
  }

  const participantNames = new Map(
    participants.map((participant) => [participant.id, participant.displayName]),
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[920px] border-collapse text-sm">
        <thead className="bg-zinc-50 text-left text-zinc-500">
          <tr>
            <th className="px-4 py-3 font-medium">판매 시각</th>
            <th className="px-4 py-3 font-medium">구매자</th>
            <th className="px-4 py-3 font-medium">판매 라인</th>
            <th className="px-4 py-3 font-medium">결제</th>
            <th className="px-4 py-3 text-right font-medium">합계</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {receipts.map((receipt) => (
            <tr data-testid="receipt-row" key={receipt.id}>
              <td className="px-4 py-3 text-zinc-700">
                {formatDateTime(receipt.soldAt)}
              </td>
              <td className="px-4 py-3 font-medium text-zinc-950">
                {receipt.customerLabel ?? "-"}
              </td>
              <td className="px-4 py-3 text-zinc-700">
                {formatSaleLines(receipt, participantNames)}
              </td>
              <td className="px-4 py-3 text-zinc-700">
                {formatPaymentSplits(receipt)}
              </td>
              <td className="px-4 py-3 text-right font-semibold text-zinc-950">
                {formatWon(receipt.totalAmount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function getFormString(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function getOptionalFormString(
  formData: FormData,
  name: string,
): string | undefined {
  const value = getFormString(formData, name).trim();
  return value || undefined;
}

function getNumber(formData: FormData, name: string): number | undefined {
  const value = getOptionalFormString(formData, name);

  if (!value) {
    return undefined;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : undefined;
}

function getRequiredNumber(
  formData: FormData,
  name: string,
  message: string,
): number {
  const value = getNumber(formData, name);

  if (value === undefined) {
    throw new Error(message);
  }

  return value;
}

function getPercentRate(formData: FormData, name: string): number | undefined {
  const value = getNumber(formData, name);
  return value === undefined ? undefined : value / 100;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "요청을 처리하지 못했습니다.";
}

function countMarketsByStatus(
  markets: Market[] | undefined,
  status: MarketStatus,
): string {
  return String(markets?.filter((market) => market.status === status).length ?? 0);
}

function formatDateRange(startsOn: string | null, endsOn: string | null): string {
  if (!startsOn && !endsOn) {
    return "-";
  }

  if (startsOn && endsOn) {
    return `${startsOn} - ${endsOn}`;
  }

  return startsOn ?? endsOn ?? "-";
}

function formatWon(value: number): string {
  return `${new Intl.NumberFormat("ko-KR").format(value)}원`;
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(2).replace(/\\.00$/, "")}%`;
}

function formatDateTime(value: string): string {
  try {
    return new Intl.DateTimeFormat("ko-KR", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatSaleLines(
  receipt: Receipt,
  participantNames: Map<string, string>,
): string {
  return receipt.saleLines
    .map((saleLine) => {
      const participantName =
        participantNames.get(saleLine.participantId) ?? "참가자";
      const itemNames = saleLine.items
        .map((item) => item.itemName)
        .filter(Boolean)
        .join(", ");

      return `${participantName} · ${itemNames || formatWon(saleLine.netAmount)}`;
    })
    .join(" / ");
}

function formatPaymentSplits(receipt: Receipt): string {
  return receipt.paymentSplits
    .map(
      (paymentSplit) =>
        `${paymentMethodLabels[paymentSplit.paymentMethod]} ${formatWon(
          paymentSplit.amount,
        )}`,
    )
    .join(" / ");
}
