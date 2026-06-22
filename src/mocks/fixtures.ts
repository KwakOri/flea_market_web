import type { AuditLog } from "@/services/audit-logs.service";
import type { AuthUser } from "@/services/auth.service";
import type { Market } from "@/services/markets.service";
import type { Participant } from "@/services/participants.service";
import type { Product } from "@/services/products.service";
import type { Receipt } from "@/services/receipts.service";
import type { SettlementDefaultSettings } from "@/services/settlement-settings.service";
import type { Settlement } from "@/services/settlements.service";

export const mockUser: AuthUser = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "designer@flea-market.local",
  displayName: "디자이너 프리뷰",
  avatarUrl: null,
  role: "admin",
  status: "active",
  emailVerifiedAt: "2026-05-01T09:00:00.000+09:00",
};

export const mockMarkets: Market[] = [
  {
    id: "22222222-2222-4222-8222-222222222201",
    name: "2026 봄 플리마켓",
    description: "UI 검수용 매출/영수증 샘플이 포함된 플리마켓",
    status: "closed",
    startsOn: "2026-05-02",
    endsOn: "2026-05-08",
    createdBy: mockUser.id,
    createdAt: "2026-04-20T09:00:00.000+09:00",
    updatedAt: "2026-05-09T18:20:00.000+09:00",
  },
  {
    id: "22222222-2222-4222-8222-222222222202",
    name: "2026 여름 플리마켓",
    description: "진행 중 상태와 빈 화면을 함께 확인하기 위한 샘플",
    status: "active",
    startsOn: "2026-06-13",
    endsOn: "2026-06-13",
    createdBy: mockUser.id,
    createdAt: "2026-06-01T10:30:00.000+09:00",
    updatedAt: "2026-06-14T11:10:00.000+09:00",
  },
];

export const mockParticipantMasters: Participant[] = [
  createParticipantMaster({
    id: "44444444-4444-4444-8444-444444444401",
    displayName: "라온 문구점",
    participantType: "staff",
    contactName: "운영 매니저",
    phone: "010-1000-0001",
    email: "ops@example.local",
    memo: "현장 운영 및 정산 확인",
  }),
  createParticipantMaster({
    id: "44444444-4444-4444-8444-444444444402",
    displayName: "모퉁이 꽃가게",
    participantType: "staff",
    contactName: "안내 담당자",
    phone: "010-1000-0002",
    email: "gate@example.local",
    memo: "입장 안내와 현장 문의 응대",
  }),
  createParticipantMaster({
    id: "44444444-4444-4444-8444-444444444403",
    displayName: "달빛 잡화점",
    participantType: "seller",
    contactName: "김민서",
    phone: "010-2000-0001",
    email: "moon-goods@example.local",
    memo: "생활 소품과 작은 선물류",
  }),
  createParticipantMaster({
    id: "44444444-4444-4444-8444-444444444404",
    displayName: "초록 식탁",
    participantType: "seller",
    contactName: "박지우",
    phone: "010-2000-0002",
    email: "green-table@example.local",
    memo: "수제 잼과 간단한 먹거리",
  }),
  createParticipantMaster({
    id: "44444444-4444-4444-8444-444444444405",
    displayName: "리틀 빈티지",
    participantType: "seller",
    contactName: "이서연",
    phone: "010-2000-0003",
    email: "little-vintage@example.local",
    memo: "빈티지 의류와 패브릭 소품",
  }),
  createParticipantMaster({
    id: "44444444-4444-4444-8444-444444444406",
    displayName: "책방 낮달",
    participantType: "seller",
    contactName: "최하준",
    phone: "010-2000-0004",
    email: "book-moon@example.local",
    memo: "독립출판물과 중고서적",
  }),
  createParticipantMaster({
    id: "44444444-4444-4444-8444-444444444407",
    displayName: "손끝 공방",
    participantType: "seller",
    contactName: "정유나",
    phone: "010-2000-0005",
    email: "craft@example.local",
    memo: "도자기와 수공예품",
  }),
  createParticipantMaster({
    id: "44444444-4444-4444-8444-444444444410",
    displayName: "교환 테이블",
    participantType: "special_booth",
    contactName: "현장 운영팀",
    phone: "010-3000-0001",
    email: "exchange@example.local",
    memo: "이벤트 교환권/프로모션 부스",
  }),
];

export const mockMarketParticipants: Participant[] = [
  createMarketParticipant({
    participant: mockParticipantMasters[0],
    marketId: mockMarkets[0].id,
    marketParticipantId: "55555555-5555-4555-8555-555555555401",
    participantType: "staff",
  }),
  createMarketParticipant({
    participant: mockParticipantMasters[2],
    marketId: mockMarkets[0].id,
    marketParticipantId: "55555555-5555-4555-8555-555555555403",
    participantType: "seller",
  }),
  createMarketParticipant({
    participant: mockParticipantMasters[3],
    marketId: mockMarkets[0].id,
    marketParticipantId: "55555555-5555-4555-8555-555555555404",
    participantType: "seller",
    feeSettingOverrideEnabled: true,
    salesCommissionRate: 0.12,
    cardFeeRate: 0.032,
    cardFeePayer: "participant",
    participationFeeAmount: 25000,
  }),
  createMarketParticipant({
    participant: mockParticipantMasters[4],
    marketId: mockMarkets[0].id,
    marketParticipantId: "55555555-5555-4555-8555-555555555405",
    participantType: "seller",
  }),
  createMarketParticipant({
    participant: mockParticipantMasters[5],
    marketId: mockMarkets[0].id,
    marketParticipantId: "55555555-5555-4555-8555-555555555406",
    participantType: "seller",
  }),
  createMarketParticipant({
    participant: mockParticipantMasters[7],
    marketId: mockMarkets[0].id,
    marketParticipantId: "55555555-5555-4555-8555-555555555410",
    participantType: "special_booth",
    feeSettingOverrideEnabled: true,
    settlementType: "manual",
    salesCommissionRate: 0,
    cardFeeRate: 0,
    cardFeePayer: "market",
    participationFeeAmount: 0,
  }),
  createMarketParticipant({
    participant: mockParticipantMasters[2],
    marketId: mockMarkets[1].id,
    marketParticipantId: "55555555-5555-4555-8555-555555555503",
    participantType: "seller",
  }),
  createMarketParticipant({
    participant: mockParticipantMasters[6],
    marketId: mockMarkets[1].id,
    marketParticipantId: "55555555-5555-4555-8555-555555555507",
    participantType: "seller",
  }),
  createMarketParticipant({
    participant: mockParticipantMasters[1],
    marketId: mockMarkets[1].id,
    marketParticipantId: "55555555-5555-4555-8555-555555555502",
    participantType: "staff",
  }),
];

export const mockProducts: Product[] = [
  createProduct({
    id: "66666666-6666-4666-8666-666666666401",
    marketId: mockMarkets[0].id,
    participantId: mockParticipantMasters[2].id,
    name: "패브릭 파우치",
    sku: "MOON-PCH-01",
    priceAmount: 18000,
  }),
  createProduct({
    id: "66666666-6666-4666-8666-666666666402",
    marketId: mockMarkets[0].id,
    participantId: mockParticipantMasters[2].id,
    name: "세라믹 컵",
    sku: "MOON-CUP-02",
    priceAmount: 22000,
  }),
  createProduct({
    id: "66666666-6666-4666-8666-666666666403",
    marketId: mockMarkets[0].id,
    participantId: mockParticipantMasters[3].id,
    name: "수제 딸기잼",
    sku: "TABLE-JAM-01",
    priceAmount: 12000,
  }),
  createProduct({
    id: "66666666-6666-4666-8666-666666666404",
    marketId: mockMarkets[0].id,
    participantId: mockParticipantMasters[4].id,
    name: "빈티지 스카프",
    sku: "VINT-SCF-01",
    priceAmount: 28000,
  }),
];

export const mockReceipts: Receipt[] = [
  createReceiptFixture({
    id: "77777777-7777-4777-8777-777777777401",
    marketId: mockMarkets[0].id,
    receiptNo: "R-20260502-001",
    soldAt: "2026-05-02T11:12:00.000+09:00",
    paymentSplits: [{ paymentMethod: "card", amount: 58000 }],
    saleLines: [
      {
        participantId: mockParticipantMasters[2].id,
        itemName: "패브릭 파우치 외",
        amount: 36000,
      },
      {
        participantId: mockParticipantMasters[3].id,
        itemName: "수제 딸기잼 세트",
        amount: 22000,
      },
    ],
  }),
  createReceiptFixture({
    id: "77777777-7777-4777-8777-777777777402",
    marketId: mockMarkets[0].id,
    receiptNo: "R-20260503-014",
    soldAt: "2026-05-03T15:32:00.000+09:00",
    memo: "현금/이체 분할 결제",
    paymentSplits: [
      { paymentMethod: "cash", amount: 30000 },
      { paymentMethod: "transfer", amount: 48000 },
    ],
    saleLines: [
      {
        participantId: mockParticipantMasters[4].id,
        itemName: "빈티지 스카프",
        amount: 28000,
      },
      {
        participantId: mockParticipantMasters[5].id,
        itemName: "독립출판 도서",
        amount: 50000,
      },
    ],
  }),
  createReceiptFixture({
    id: "77777777-7777-4777-8777-777777777403",
    marketId: mockMarkets[0].id,
    receiptNo: "R-20260505-027",
    soldAt: "2026-05-05T13:05:00.000+09:00",
    paymentSplits: [{ paymentMethod: "card", amount: 46000 }],
    saleLines: [
      {
        participantId: mockParticipantMasters[2].id,
        itemName: "세라믹 컵",
        amount: 22000,
      },
      {
        participantId: mockParticipantMasters[7].id,
        itemName: "교환권 굿즈",
        amount: 24000,
      },
    ],
  }),
  createReceiptFixture({
    id: "77777777-7777-4777-8777-777777777501",
    marketId: mockMarkets[1].id,
    receiptNo: "R-20260613-004",
    soldAt: "2026-06-13T12:18:00.000+09:00",
    paymentSplits: [{ paymentMethod: "cash", amount: 42000 }],
    saleLines: [
      {
        participantId: mockParticipantMasters[2].id,
        itemName: "여름 소품 세트",
        amount: 42000,
      },
    ],
  }),
  ...createGeneratedReceiptFixtures({
    count: 72,
    dayCount: 7,
    idOffset: 1000,
    itemNames: [
      "생활 소품 세트",
      "수제 잼 패키지",
      "빈티지 패브릭",
      "독립출판 도서",
      "교환권 굿즈",
      "현장 추가 구매",
    ],
    marketId: mockMarkets[0].id,
    participantIds: [
      mockParticipantMasters[2].id,
      mockParticipantMasters[3].id,
      mockParticipantMasters[4].id,
      mockParticipantMasters[5].id,
      mockParticipantMasters[7].id,
    ],
    receiptNoPrefix: "R-202605",
    startDay: 2,
    startIndex: 101,
  }),
  ...createGeneratedReceiptFixtures({
    count: 24,
    dayCount: 1,
    idOffset: 2000,
    itemNames: [
      "여름 소품 세트",
      "수공예 컵",
      "패브릭 키링",
      "현장 이벤트 상품",
    ],
    marketId: mockMarkets[1].id,
    participantIds: [
      mockParticipantMasters[2].id,
      mockParticipantMasters[6].id,
    ],
    receiptNoPrefix: "R-202606",
    startDay: 13,
    startIndex: 101,
  }),
];

export const mockGlobalSettlementSettings: SettlementDefaultSettings = {
  id: "88888888-8888-4888-8888-888888888001",
  scope: "global",
  marketId: null,
  settlementType: "commission",
  salesCommissionRate: 0.1,
  cardFeeRate: 0.032,
  cardFeePayer: "market",
  participationFeeAmount: 0,
  createdBy: mockUser.id,
  createdAt: "2026-04-01T09:00:00.000+09:00",
  updatedAt: "2026-04-01T09:00:00.000+09:00",
};

export const mockMarketSettlementSettings: SettlementDefaultSettings[] = [
  {
    id: "88888888-8888-4888-8888-888888888201",
    scope: "market",
    marketId: mockMarkets[0].id,
    settlementType: "commission",
    salesCommissionRate: 0.1,
    cardFeeRate: 0.032,
    cardFeePayer: "participant",
    participationFeeAmount: 20000,
    createdBy: mockUser.id,
    createdAt: "2026-04-22T09:00:00.000+09:00",
    updatedAt: "2026-04-22T09:00:00.000+09:00",
  },
  {
    id: "88888888-8888-4888-8888-888888888202",
    scope: "market",
    marketId: mockMarkets[1].id,
    settlementType: "commission",
    salesCommissionRate: 0.08,
    cardFeeRate: 0.03,
    cardFeePayer: "market",
    participationFeeAmount: 10000,
    createdBy: mockUser.id,
    createdAt: "2026-06-01T10:40:00.000+09:00",
    updatedAt: "2026-06-01T10:40:00.000+09:00",
  },
];

export const mockSettlements: Settlement[] = [];

export const mockAuditLogs: AuditLog[] = [
  createAuditLog({
    id: "99999999-9999-4999-8999-999999999501",
    occurredAt: "2026-06-13T12:22:00.000+09:00",
    category: "receipt",
    action: "create",
    marketId: mockMarkets[1].id,
    targetType: "receipt",
    targetId: mockReceipts[3].id,
    summary: "영수증 R-20260613-004 저장",
    metadata: {
      receiptNo: "R-20260613-004",
      totalAmount: 42000,
    },
  }),
  createAuditLog({
    id: "99999999-9999-4999-8999-999999999401",
    occurredAt: "2026-05-05T18:30:00.000+09:00",
    category: "fee_policy",
    action: "update",
    marketId: mockMarkets[0].id,
    targetType: "settlement_default_settings",
    targetId: mockMarketSettlementSettings[0].id,
    summary: "플리마켓 수수료 정책 수정",
    metadata: {
      salesCommissionRate: 0.1,
      cardFeePayer: "participant",
    },
  }),
  createAuditLog({
    id: "99999999-9999-4999-8999-999999999402",
    occurredAt: "2026-05-03T15:35:00.000+09:00",
    category: "receipt",
    action: "create",
    marketId: mockMarkets[0].id,
    targetType: "receipt",
    targetId: mockReceipts[1].id,
    summary: "영수증 R-20260503-014 저장",
    metadata: {
      receiptNo: "R-20260503-014",
      saleLineCount: 2,
      totalAmount: 78000,
    },
  }),
  createAuditLog({
    id: "99999999-9999-4999-8999-999999999403",
    occurredAt: "2026-05-02T10:05:00.000+09:00",
    category: "auth_security",
    action: "login",
    marketId: null,
    targetType: "user",
    targetId: mockUser.id,
    summary: "디자이너 프리뷰 로그인",
    metadata: {
      mode: "mock",
    },
  }),
];

function createParticipantMaster(input: {
  id: string;
  displayName: string;
  participantType: Participant["participantType"];
  contactName: string | null;
  phone: string | null;
  email: string | null;
  memo: string | null;
}): Participant {
  return {
    id: input.id,
    marketId: null,
    marketParticipantId: null,
    displayName: input.displayName,
    participantType: input.participantType,
    contactName: input.contactName,
    phone: input.phone,
    email: input.email,
    memo: input.memo,
    status: "active",
    settings: null,
    createdAt: "2026-04-18T09:00:00.000+09:00",
    updatedAt: "2026-04-18T09:00:00.000+09:00",
  };
}

function createMarketParticipant(input: {
  participant: Participant;
  marketId: string;
  marketParticipantId: string;
  participantType: Participant["participantType"];
  feeSettingOverrideEnabled?: boolean;
  settlementType?: NonNullable<Participant["settings"]>["settlementType"];
  salesCommissionRate?: number;
  cardFeeRate?: number;
  cardFeePayer?: NonNullable<Participant["settings"]>["cardFeePayer"];
  participationFeeAmount?: number;
}): Participant {
  const overrideEnabled = input.feeSettingOverrideEnabled ?? false;

  return {
    ...input.participant,
    marketId: input.marketId,
    marketParticipantId: input.marketParticipantId,
    participantType: input.participantType,
    settings: {
      id: input.marketParticipantId,
      marketParticipantId: input.marketParticipantId,
      participantId: input.participant.id,
      marketId: input.marketId,
      feeSettingOverrideEnabled: overrideEnabled,
      settlementType: overrideEnabled ? (input.settlementType ?? "commission") : null,
      salesCommissionRate: overrideEnabled
        ? (input.salesCommissionRate ?? 0)
        : null,
      cardFeeRate: overrideEnabled ? (input.cardFeeRate ?? 0) : null,
      cardFeePayer: overrideEnabled ? (input.cardFeePayer ?? "market") : null,
      participationFeeAmount: overrideEnabled
        ? (input.participationFeeAmount ?? 0)
        : null,
      payoutBankName: null,
      payoutAccountNumber: null,
      payoutAccountHolder: null,
      createdAt: "2026-04-24T09:30:00.000+09:00",
      updatedAt: "2026-04-24T09:30:00.000+09:00",
    },
  };
}

function createProduct(input: {
  id: string;
  marketId: string;
  participantId: string;
  name: string;
  sku: string;
  priceAmount: number;
}): Product {
  return {
    ...input,
    status: "active",
    createdAt: "2026-04-25T11:00:00.000+09:00",
    updatedAt: "2026-04-25T11:00:00.000+09:00",
  };
}

function createReceiptFixture(input: {
  id: string;
  marketId: string;
  receiptNo: string;
  soldAt: string;
  memo?: string;
  paymentSplits: Array<{
    paymentMethod: Receipt["paymentSplits"][number]["paymentMethod"];
    amount: number;
  }>;
  saleLines: Array<{
    participantId: string;
    itemName: string;
    amount: number;
  }>;
}): Receipt {
  const subtotalAmount = input.saleLines.reduce(
    (sum, saleLine) => sum + saleLine.amount,
    0,
  );

  return {
    id: input.id,
    marketId: input.marketId,
    marketDayId: null,
    receiptNo: input.receiptNo,
    customerLabel: null,
    soldAt: input.soldAt,
    subtotalAmount,
    discountAmount: 0,
    totalAmount: subtotalAmount,
    memo: input.memo ?? null,
    createdBy: mockUser.id,
    paymentSplits: input.paymentSplits.map((paymentSplit, index) => ({
      id: `${input.id}-payment-${index + 1}`,
      receiptId: input.id,
      paymentMethod: paymentSplit.paymentMethod,
      amount: paymentSplit.amount,
      referenceNo: null,
      createdAt: input.soldAt,
      updatedAt: input.soldAt,
    })),
    saleLines: input.saleLines.map((saleLine, index) => {
      const saleLineId = `${input.id}-line-${index + 1}`;

      return {
        id: saleLineId,
        receiptId: input.id,
        participantId: saleLine.participantId,
        grossAmount: saleLine.amount,
        discountAmount: 0,
        netAmount: saleLine.amount,
        memo: null,
        items: [
          {
            id: `${saleLineId}-item-1`,
            saleLineId,
            productId: null,
            itemName: saleLine.itemName,
            quantity: 1,
            unitPriceAmount: saleLine.amount,
            grossAmount: saleLine.amount,
            discountAmount: 0,
            netAmount: saleLine.amount,
            memo: null,
            createdAt: input.soldAt,
            updatedAt: input.soldAt,
          },
        ],
        createdAt: input.soldAt,
        updatedAt: input.soldAt,
      };
    }),
    createdAt: input.soldAt,
    updatedAt: input.soldAt,
  };
}

function createGeneratedReceiptFixtures(input: {
  count: number;
  dayCount: number;
  idOffset: number;
  itemNames: string[];
  marketId: string;
  participantIds: string[];
  receiptNoPrefix: string;
  startDay: number;
  startIndex: number;
}): Receipt[] {
  return Array.from({ length: input.count }, (_, index) => {
    const day = input.startDay + (index % input.dayCount);
    const hour = 10 + (index % 8);
    const minute = (index * 7) % 60;
    const lineCount = Math.min(1 + (index % 3), input.participantIds.length);
    const saleLines = Array.from({ length: lineCount }, (_line, lineIndex) => {
      const participantId =
        input.participantIds[(index + lineIndex) % input.participantIds.length];
      const baseAmount = 8000 + (((index + 3) * (lineIndex + 2) * 3500) % 52000);
      const amount = Math.round(baseAmount / 1000) * 1000;

      return {
        participantId,
        itemName:
          input.itemNames[(index + lineIndex) % input.itemNames.length],
        amount,
      };
    });
    const totalAmount = saleLines.reduce(
      (sum, saleLine) => sum + saleLine.amount,
      0,
    );

    return createReceiptFixture({
      id: `77777777-7777-4777-8777-${String(
        777777770000 + input.idOffset + index,
      )}`,
      marketId: input.marketId,
      receiptNo: `${input.receiptNoPrefix}${String(day).padStart(2, "0")}-${String(
        input.startIndex + index,
      ).padStart(3, "0")}`,
      soldAt: `${input.receiptNoPrefix.slice(2, 6)}-${input.receiptNoPrefix.slice(
        6,
        8,
      )}-${String(day).padStart(2, "0")}T${String(hour).padStart(
        2,
        "0",
      )}:${String(minute).padStart(2, "0")}:00.000+09:00`,
      memo: index % 11 === 0 ? "mock 대량 영수증 샘플" : undefined,
      paymentSplits: buildGeneratedPaymentSplits(totalAmount, index),
      saleLines,
    });
  });
}

function buildGeneratedPaymentSplits(
  totalAmount: number,
  index: number,
): Array<{
  paymentMethod: Receipt["paymentSplits"][number]["paymentMethod"];
  amount: number;
}> {
  if (index % 5 === 0) {
    const cashAmount = Math.round(totalAmount * 0.4);

    return [
      { paymentMethod: "cash", amount: cashAmount },
      { paymentMethod: "transfer", amount: totalAmount - cashAmount },
    ];
  }

  const paymentMethods: Array<
    Receipt["paymentSplits"][number]["paymentMethod"]
  > = ["cash", "card", "transfer", "other"];

  return [
    {
      paymentMethod: paymentMethods[index % paymentMethods.length],
      amount: totalAmount,
    },
  ];
}

function createAuditLog(
  input: Pick<
    AuditLog,
    | "action"
    | "category"
    | "id"
    | "marketId"
    | "metadata"
    | "occurredAt"
    | "summary"
    | "targetId"
    | "targetType"
  >,
): AuditLog {
  return {
    ...input,
    actorUserId: mockUser.id,
    actorDisplayName: mockUser.displayName,
    actorRole: mockUser.role,
    result: "success",
    ipAddress: "127.0.0.1",
    userAgent: "Mock browser",
    requestId: null,
    createdAt: input.occurredAt,
  };
}
