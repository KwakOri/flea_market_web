import type {
  AuditLog,
  AuditLogAction,
  AuditLogCategory,
  AuditLogListParams,
  AuditLogListResponse,
  AuditLogResult,
} from "@/services/audit-logs.service";
import type { AuthResponse } from "@/services/auth.service";
import type {
  CreatedInvitation,
  Invitation,
  InvitationValidation,
} from "@/services/invitations.service";
import type {
  CreateMarketPayload,
  Market,
  UpdateMarketPayload,
} from "@/services/markets.service";
import type {
  CreateParticipantPayload,
  Participant,
  UpdateParticipantPayload,
} from "@/services/participants.service";
import type {
  CreateProductPayload,
  Product,
  UpdateProductPayload,
} from "@/services/products.service";
import type {
  CreateReceiptPayload,
  PaymentMethod,
  Receipt,
  UpdateReceiptPayload,
} from "@/services/receipts.service";
import type {
  SettlementDefaultSettings,
  SettlementFeeSettings,
  UpdateSettlementFeeSettingsPayload,
} from "@/services/settlement-settings.service";
import type {
  MarketSettlementPreview,
  ParticipantSettlementPreview,
  Settlement,
  SettlementListItem,
  SettlementParticipantSnapshot,
} from "@/services/settlements.service";
import { ApiError } from "@/services/api-client";
import {
  cloneMockData,
  createMockId,
  getMockState,
  nowIsoString,
  persistMockState,
  resetMockState,
} from "@/mocks/mock-db";
import { FLEA_MARKET, PARTICIPATING_SELLER, SELLER } from "@/lib/terminology";

type MockDownloadResult = {
  blob: Blob;
  filename: string;
};

type PaymentMethodAmounts = Record<PaymentMethod, number>;
type ParticipantSettlementPreviewWithMarket = ParticipantSettlementPreview & {
  marketCostAmount: number;
  marketIncomeAmount: number;
  marketProfitAmount: number;
};

export class MockApiError extends ApiError {
  constructor(
    readonly status: number,
    message: string,
    readonly body: { message: string; statusCode: number },
  ) {
    super(message, status, body);
  }
}

export async function handleMockApiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const result = routeMockApi(path, init);
  return cloneMockData(result) as T;
}

export async function handleMockApiDownload(
  path: string,
  fallbackFilename: string,
): Promise<MockDownloadResult> {
  const url = createMockUrl(path);
  const settlementPdfMatch = url.pathname.match(
    /^\/markets\/([^/]+)\/settlement-pdfs$/,
  );

  if (!settlementPdfMatch?.[1]) {
    throw notFound(`Mock download route not found: ${url.pathname}`);
  }

  const marketId = settlementPdfMatch[1];
  const market = findMarket(marketId);
  const filename = `${market.name.replace(/\s+/g, "_")}_mock_settlements.zip`;

  recordAuditLog({
    action: "download",
    category: "export",
    marketId,
    metadata: {
      fileName: filename,
      mode: "mock",
    },
    summary: `${SELLER}별 정산 PDF 다운로드`,
    targetId: marketId,
    targetType: "settlement_pdf_archive",
  });
  persistMockState();

  return {
    blob: new Blob(
      [
        [
          "Mock settlement PDF archive",
          `market=${market.name}`,
          `generatedAt=${nowIsoString()}`,
        ].join("\n"),
      ],
      { type: "application/zip" },
    ),
    filename: filename || fallbackFilename,
  };
}

function routeMockApi(path: string, init: RequestInit): unknown {
  const url = createMockUrl(path);
  const method = getMethod(init);

  if (method === "GET" && url.pathname === "/health") {
    return { status: "ok", service: "web-mock-api" };
  }

  if (url.pathname === "/__mock/reset" && method === "POST") {
    resetMockState();
    return { ok: true };
  }

  if (url.pathname === "/auth/me" && method === "GET") {
    const state = getMockState();

    if (!state.isAuthenticated) {
      throw unauthorized("Authentication is required.");
    }

    return { user: state.currentUser } satisfies AuthResponse;
  }

  if (url.pathname === "/auth/invitations" && method === "GET") {
    const state = getMockState();
    assertMockAdmin();

    state.signupInvitations = state.signupInvitations.map((invitation) => ({
      ...invitation,
      status: getMockInvitationStatus(invitation),
    }));

    return [...state.signupInvitations].sort((left, right) =>
      right.createdAt.localeCompare(left.createdAt),
    );
  }

  if (url.pathname === "/auth/invitations" && method === "POST") {
    assertMockAdmin();
    const payload = readJsonBody<{ email?: string }>(init);
    const email = payload.email?.trim().toLowerCase();

    if (!email || !email.includes("@")) {
      throw badRequest("A valid email is required.");
    }

    const state = getMockState();
    if (state.currentUser.email.toLowerCase() === email) {
      throw conflict("Email is already registered.");
    }

    const now = nowIsoString();
    state.signupInvitations = state.signupInvitations.map((invitation) =>
      invitation.email.toLowerCase() === email &&
      getMockInvitationStatus(invitation) === "pending"
        ? { ...invitation, revokedAt: now, status: "revoked" }
        : invitation,
    );

    const id = createMockId("invitation");
    const invitation: Invitation = {
      id,
      email,
      status: "pending",
      expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
      usedAt: null,
      revokedAt: null,
      createdAt: now,
      createdByUserId: state.currentUser.id,
      acceptedByUserId: null,
    };
    state.signupInvitations.unshift(invitation);
    recordAuditLog({
      action: "create",
      category: "auth_security",
      metadata: { email, mode: "mock" },
      summary: `계정 ${email} 초대 발급`,
      targetId: id,
      targetType: "signup_invitation",
    });
    persistMockState();

    return {
      ...invitation,
      inviteUrl: createMockInviteUrl(id),
      deliveryStatus: "sent",
    } satisfies CreatedInvitation;
  }

  if (url.pathname === "/auth/invitations/validate" && method === "POST") {
    const payload = readJsonBody<{ token?: string }>(init);
    const invitation = findActiveMockInvitation(payload.token);

    return {
      emailHint: maskMockEmail(invitation.email),
      expiresAt: invitation.expiresAt,
    } satisfies InvitationValidation;
  }

  if (url.pathname === "/auth/invitations/accept" && method === "POST") {
    const payload = readJsonBody<{
      displayName?: string;
      password?: string;
      token?: string;
    }>(init);
    const invitation = findActiveMockInvitation(payload.token);
    const displayName = payload.displayName?.trim();

    if (!displayName || !payload.password || payload.password.length < 8) {
      throw badRequest(
        "Name and a password of at least 8 characters are required.",
      );
    }

    const state = getMockState();
    const acceptedAt = nowIsoString();
    const userId = createMockId("user");
    invitation.status = "accepted";
    invitation.usedAt = acceptedAt;
    invitation.acceptedByUserId = userId;
    state.currentUser = {
      id: userId,
      email: invitation.email,
      displayName,
      avatarUrl: null,
      role: "user",
      status: "active",
      emailVerifiedAt: acceptedAt,
    };
    state.isAuthenticated = true;
    recordAuditLog({
      action: "register",
      category: "auth_security",
      metadata: { email: invitation.email, mode: "mock" },
      summary: `계정 ${displayName} 초대 가입`,
      targetId: userId,
      targetType: "user",
    });
    persistMockState();

    return { user: state.currentUser } satisfies AuthResponse;
  }

  const revokeInvitationMatch = url.pathname.match(
    /^\/auth\/invitations\/([^/]+)\/revoke$/,
  );

  if (revokeInvitationMatch?.[1] && method === "POST") {
    assertMockAdmin();
    const state = getMockState();
    const invitation = state.signupInvitations.find(
      (candidate) => candidate.id === revokeInvitationMatch[1],
    );

    if (!invitation) {
      throw notFound("Invitation not found.");
    }

    if (getMockInvitationStatus(invitation) === "accepted") {
      throw conflict("Accepted invitation cannot be revoked.");
    }

    if (!invitation.revokedAt) {
      invitation.revokedAt = nowIsoString();
      invitation.status = "revoked";
      recordAuditLog({
        action: "update",
        category: "auth_security",
        metadata: { email: invitation.email, mode: "mock" },
        summary: `계정 ${invitation.email} 초대 폐기`,
        targetId: invitation.id,
        targetType: "signup_invitation",
      });
      persistMockState();
    }

    return invitation;
  }

  if (url.pathname === "/auth/login" && method === "POST") {
    const state = getMockState();
    state.isAuthenticated = true;
    recordAuditLog({
      action: "login",
      category: "auth_security",
      metadata: { mode: "mock" },
      summary: "디자이너 프리뷰 로그인",
      targetId: state.currentUser.id,
      targetType: "user",
    });
    persistMockState();
    return { user: state.currentUser } satisfies AuthResponse;
  }

  if (url.pathname === "/auth/logout" && method === "POST") {
    const state = getMockState();
    recordAuditLog({
      action: "logout",
      category: "auth_security",
      metadata: { mode: "mock" },
      summary: "디자이너 프리뷰 로그아웃",
      targetId: state.currentUser.id,
      targetType: "user",
    });
    state.isAuthenticated = false;
    persistMockState();
    return { ok: true };
  }

  if (url.pathname === "/audit-logs" && method === "GET") {
    return listAuditLogs(url);
  }

  if (url.pathname === "/markets" && method === "GET") {
    return [...getMockState().markets].sort(compareUpdatedDesc);
  }

  if (url.pathname === "/markets" && method === "POST") {
    return createMarket(readJsonBody<CreateMarketPayload>(init));
  }

  const marketMatch = url.pathname.match(/^\/markets\/([^/]+)$/);

  if (marketMatch?.[1] && method === "GET") {
    return findMarket(marketMatch[1]);
  }

  if (marketMatch?.[1] && method === "PATCH") {
    return updateMarket(marketMatch[1], readJsonBody<UpdateMarketPayload>(init));
  }

  const marketParticipantsMatch = url.pathname.match(
    /^\/markets\/([^/]+)\/participants$/,
  );

  if (marketParticipantsMatch?.[1] && method === "GET") {
    return getMockState().marketParticipants
      .filter((participant) => participant.marketId === marketParticipantsMatch[1])
      .sort(compareUpdatedDesc);
  }

  if (marketParticipantsMatch?.[1] && method === "POST") {
    return createMarketParticipant(
      marketParticipantsMatch[1],
      readJsonBody<CreateParticipantPayload>(init),
    );
  }

  const marketParticipantMatch = url.pathname.match(
    /^\/markets\/([^/]+)\/participants\/([^/]+)$/,
  );

  if (marketParticipantMatch?.[1] && marketParticipantMatch[2] && method === "PATCH") {
    return updateMarketParticipant(
      marketParticipantMatch[1],
      marketParticipantMatch[2],
      readJsonBody<UpdateParticipantPayload>(init),
    );
  }

  if (marketParticipantMatch?.[1] && marketParticipantMatch[2] && method === "DELETE") {
    deleteMarketParticipant(marketParticipantMatch[1], marketParticipantMatch[2]);
    return undefined;
  }

  if (url.pathname === "/participants" && method === "GET") {
    return [...getMockState().participantMasters].sort(compareUpdatedDesc);
  }

  if (url.pathname === "/participants" && method === "POST") {
    return createParticipantMaster(readJsonBody<CreateParticipantPayload>(init));
  }

  const participantProductsMatch = url.pathname.match(
    /^\/participants\/([^/]+)\/products$/,
  );

  if (participantProductsMatch?.[1] && method === "GET") {
    return getMockState().products
      .filter((product) => product.participantId === participantProductsMatch[1])
      .sort(compareUpdatedDesc);
  }

  if (participantProductsMatch?.[1] && method === "POST") {
    const participant = findParticipantMaster(participantProductsMatch[1]);
    const marketId =
      getMockState().marketParticipants.find(
        (marketParticipant) => marketParticipant.id === participant.id,
      )?.marketId ?? getMockState().markets[0]?.id;

    if (!marketId) {
      throw badRequest("Market is required.");
    }

    return createProduct(
      marketId,
      participant.id,
      readJsonBody<CreateProductPayload>(init),
    );
  }

  const participantMatch = url.pathname.match(/^\/participants\/([^/]+)$/);

  if (participantMatch?.[1] && method === "GET") {
    return findParticipantMaster(participantMatch[1]);
  }

  if (participantMatch?.[1] && method === "PATCH") {
    return updateParticipantMaster(
      participantMatch[1],
      readJsonBody<UpdateParticipantPayload>(init),
    );
  }

  const marketParticipantProductsMatch = url.pathname.match(
    /^\/markets\/([^/]+)\/participants\/([^/]+)\/products$/,
  );

  if (
    marketParticipantProductsMatch?.[1] &&
    marketParticipantProductsMatch[2] &&
    method === "GET"
  ) {
    return getMockState().products
      .filter(
        (product) =>
          product.marketId === marketParticipantProductsMatch[1] &&
          product.participantId === marketParticipantProductsMatch[2],
      )
      .sort(compareUpdatedDesc);
  }

  if (
    marketParticipantProductsMatch?.[1] &&
    marketParticipantProductsMatch[2] &&
    method === "POST"
  ) {
    return createProduct(
      marketParticipantProductsMatch[1],
      marketParticipantProductsMatch[2],
      readJsonBody<CreateProductPayload>(init),
    );
  }

  const productMatch = url.pathname.match(/^\/products\/([^/]+)$/);

  if (productMatch?.[1] && method === "GET") {
    return findProduct(productMatch[1]);
  }

  if (productMatch?.[1] && method === "PATCH") {
    return updateProduct(productMatch[1], readJsonBody<UpdateProductPayload>(init));
  }

  const marketReceiptsMatch = url.pathname.match(/^\/markets\/([^/]+)\/receipts$/);

  if (marketReceiptsMatch?.[1] && method === "GET") {
    return getMockState().receipts
      .filter((receipt) => receipt.marketId === marketReceiptsMatch[1])
      .sort(compareSoldAtDesc);
  }

  if (marketReceiptsMatch?.[1] && method === "POST") {
    return createReceipt(
      marketReceiptsMatch[1],
      readJsonBody<CreateReceiptPayload>(init),
    );
  }

  const receiptMatch = url.pathname.match(/^\/receipts\/([^/]+)$/);

  if (receiptMatch?.[1] && method === "GET") {
    return findReceipt(receiptMatch[1]);
  }

  if (receiptMatch?.[1] && method === "PATCH") {
    return updateReceipt(receiptMatch[1], readJsonBody<UpdateReceiptPayload>(init));
  }

  if (receiptMatch?.[1] && method === "DELETE") {
    deleteReceipt(receiptMatch[1]);
    return undefined;
  }

  if (url.pathname === "/settlement-settings/global" && method === "GET") {
    return getMockState().globalSettlementSettings;
  }

  if (url.pathname === "/settlement-settings/global" && method === "PUT") {
    return updateGlobalSettlementSettings(
      readJsonBody<UpdateSettlementFeeSettingsPayload>(init),
    );
  }

  const marketSettingsMatch = url.pathname.match(
    /^\/markets\/([^/]+)\/settlement-settings$/,
  );

  if (marketSettingsMatch?.[1] && method === "GET") {
    return findMarketSettlementSettings(marketSettingsMatch[1]);
  }

  if (marketSettingsMatch?.[1] && method === "PUT") {
    return updateMarketSettlementSettings(
      marketSettingsMatch[1],
      readJsonBody<UpdateSettlementFeeSettingsPayload>(init),
    );
  }

  const settlementPreviewMatch = url.pathname.match(
    /^\/markets\/([^/]+)\/settlement-preview$/,
  );

  if (settlementPreviewMatch?.[1] && method === "GET") {
    return buildSettlementPreview(settlementPreviewMatch[1]);
  }

  const marketSettlementsMatch = url.pathname.match(
    /^\/markets\/([^/]+)\/settlements$/,
  );

  if (marketSettlementsMatch?.[1] && method === "GET") {
    return getMockState().settlements
      .filter((settlement) => settlement.marketId === marketSettlementsMatch[1])
      .map(toSettlementListItem)
      .sort((left, right) => right.versionNo - left.versionNo);
  }

  if (marketSettlementsMatch?.[1] && method === "POST") {
    return createSettlement(
      marketSettlementsMatch[1],
      readJsonBody<{ memo?: string }>(init),
    );
  }

  const settlementVoidMatch = url.pathname.match(/^\/settlements\/([^/]+)\/void$/);

  if (settlementVoidMatch?.[1] && method === "POST") {
    return voidSettlement(settlementVoidMatch[1], readJsonBody<{ memo?: string }>(init));
  }

  const settlementMatch = url.pathname.match(/^\/settlements\/([^/]+)$/);

  if (settlementMatch?.[1] && method === "GET") {
    return findSettlement(settlementMatch[1]);
  }

  throw notFound(`Mock route not found: ${method} ${url.pathname}`);
}

function createMarket(payload: CreateMarketPayload): Market {
  const state = getMockState();
  const now = nowIsoString();
  const market: Market = {
    id: createMockId("market"),
    name: payload.name?.trim() || `새 ${FLEA_MARKET}`,
    description: payload.description?.trim() || null,
    status: "draft",
    startsOn: payload.startsOn ?? null,
    endsOn: payload.endsOn ?? null,
    createdBy: state.currentUser.id,
    createdAt: now,
    updatedAt: now,
  };

  state.markets.unshift(market);
  recordAuditLog({
    action: "create",
    category: "market",
    marketId: market.id,
    metadata: { name: market.name, status: market.status },
    summary: `${FLEA_MARKET} ${market.name} 생성`,
    targetId: market.id,
    targetType: "market",
  });
  persistMockState();
  return market;
}

function updateMarket(marketId: string, payload: UpdateMarketPayload): Market {
  const market = findMarket(marketId);
  const updatedMarket: Market = {
    ...market,
    description:
      payload.description !== undefined
        ? payload.description?.trim() || null
        : market.description,
    endsOn: payload.endsOn !== undefined ? payload.endsOn || null : market.endsOn,
    name: payload.name !== undefined ? payload.name.trim() || market.name : market.name,
    startsOn:
      payload.startsOn !== undefined ? payload.startsOn || null : market.startsOn,
    status: payload.status ?? market.status,
    updatedAt: nowIsoString(),
  };
  replaceById(getMockState().markets, marketId, updatedMarket);
  recordAuditLog({
    action: "update",
    category: "market",
    marketId,
    metadata: { changedFields: Object.keys(payload), status: updatedMarket.status },
    summary: `${FLEA_MARKET} ${updatedMarket.name} 수정`,
    targetId: marketId,
    targetType: "market",
  });
  persistMockState();
  return updatedMarket;
}

function createParticipantMaster(payload: CreateParticipantPayload): Participant {
  const state = getMockState();
  const now = nowIsoString();
  const participant: Participant = {
    id: createMockId("participant"),
    marketId: null,
    marketParticipantId: null,
    displayName: payload.displayName?.trim() || `새 ${SELLER}`,
    participantType: payload.participantType ?? "seller",
    contactName: payload.contactName?.trim() || null,
    phone: payload.phone?.trim() || null,
    email: payload.email?.trim() || null,
    memo: payload.memo?.trim() || null,
    status: "active",
    settings: null,
    createdAt: now,
    updatedAt: now,
  };

  state.participantMasters.unshift(participant);
  recordAuditLog({
    action: "create",
    category: "booth",
    metadata: {
      displayName: participant.displayName,
      participantType: participant.participantType,
    },
    summary: `${SELLER} ${participant.displayName} 생성`,
    targetId: participant.id,
    targetType: "participant",
  });
  persistMockState();
  return participant;
}

function updateParticipantMaster(
  participantId: string,
  payload: UpdateParticipantPayload,
): Participant {
  const participant = findParticipantMaster(participantId);
  const updatedParticipant: Participant = {
    ...participant,
    contactName:
      payload.contactName !== undefined
        ? payload.contactName?.trim() || null
        : participant.contactName,
    displayName:
      payload.displayName !== undefined
        ? payload.displayName.trim() || participant.displayName
        : participant.displayName,
    email:
      payload.email !== undefined ? payload.email?.trim() || null : participant.email,
    memo: payload.memo !== undefined ? payload.memo?.trim() || null : participant.memo,
    participantType: payload.participantType ?? participant.participantType,
    phone:
      payload.phone !== undefined ? payload.phone?.trim() || null : participant.phone,
    status: payload.status ?? participant.status,
    updatedAt: nowIsoString(),
  };

  replaceById(getMockState().participantMasters, participantId, updatedParticipant);
  syncParticipantMasterFields(updatedParticipant);
  recordAuditLog({
    action: "update",
    category: "booth",
    metadata: {
      changedFields: Object.keys(payload),
      displayName: updatedParticipant.displayName,
    },
    summary: `${SELLER} ${updatedParticipant.displayName} 수정`,
    targetId: participantId,
    targetType: "participant",
  });
  persistMockState();
  return updatedParticipant;
}

function createMarketParticipant(
  marketId: string,
  payload: CreateParticipantPayload,
): Participant {
  findMarket(marketId);

  const master = payload.participantId
    ? findParticipantMaster(payload.participantId)
    : createParticipantMaster(payload);
  const state = getMockState();
  const existing = state.marketParticipants.find(
    (participant) => participant.marketId === marketId && participant.id === master.id,
  );

  if (existing) {
    return updateMarketParticipant(marketId, master.id, payload);
  }

  const now = nowIsoString();
  const marketParticipantId = createMockId("marketParticipant");
  const marketParticipant: Participant = {
    ...master,
    marketId,
    marketParticipantId,
    participantType: payload.participantType ?? master.participantType,
    status: "active",
    settings: buildParticipantSettings({
      marketId,
      marketParticipantId,
      participantId: master.id,
      payload,
      now,
    }),
    updatedAt: now,
  };

  state.marketParticipants.unshift(marketParticipant);
  recordAuditLog({
    action: "create",
    category: "booth",
    marketId,
    metadata: {
      displayName: marketParticipant.displayName,
      feeSettingOverrideEnabled:
        marketParticipant.settings?.feeSettingOverrideEnabled ?? false,
      participantType: marketParticipant.participantType,
    },
    summary: `${PARTICIPATING_SELLER} ${marketParticipant.displayName} 연결`,
    targetId: marketParticipant.id,
    targetType: "participant",
  });
  persistMockState();
  return marketParticipant;
}

function updateMarketParticipant(
  marketId: string,
  participantId: string,
  payload: UpdateParticipantPayload | CreateParticipantPayload,
): Participant {
  const state = getMockState();
  const index = state.marketParticipants.findIndex(
    (participant) => participant.marketId === marketId && participant.id === participantId,
  );

  if (index < 0) {
    throw notFound("Participant market link not found.");
  }

  const current = state.marketParticipants[index];
  const now = nowIsoString();
  const updated: Participant = {
    ...current,
    participantType: payload.participantType ?? current.participantType,
    status: "status" in payload && payload.status ? payload.status : current.status,
    settings: updateParticipantSettings(current, payload, now),
    updatedAt: now,
  };

  state.marketParticipants[index] = updated;
  recordAuditLog({
    action: "update",
    category: "booth",
    marketId,
    metadata: {
      changedFields: Object.keys(payload),
      displayName: updated.displayName,
      feeSettingOverrideEnabled: updated.settings?.feeSettingOverrideEnabled ?? false,
      participantType: updated.participantType,
    },
    summary: `${PARTICIPATING_SELLER} ${updated.displayName} 설정 수정`,
    targetId: participantId,
    targetType: "participant",
  });
  persistMockState();
  return updated;
}

function deleteMarketParticipant(marketId: string, participantId: string) {
  const state = getMockState();
  const hasReceipt = state.receipts.some(
    (receipt) =>
      receipt.marketId === marketId &&
      receipt.saleLines.some((saleLine) => saleLine.participantId === participantId),
  );

  if (hasReceipt) {
    throw badRequest(`영수증 기록이 있는 ${PARTICIPATING_SELLER}는 삭제할 수 없습니다.`);
  }

  const nextParticipants = state.marketParticipants.filter(
    (participant) => !(participant.marketId === marketId && participant.id === participantId),
  );

  if (nextParticipants.length === state.marketParticipants.length) {
    throw notFound("Participant market link not found.");
  }

  state.marketParticipants = nextParticipants;
  recordAuditLog({
    action: "remove",
    category: "booth",
    marketId,
    summary: `${PARTICIPATING_SELLER} 연결 제거`,
    targetId: participantId,
    targetType: "participant",
  });
  persistMockState();
}

function createProduct(
  marketId: string,
  participantId: string,
  payload: CreateProductPayload,
): Product {
  findMarket(marketId);
  findParticipantMaster(participantId);

  const now = nowIsoString();
  const product: Product = {
    id: createMockId("product"),
    marketId,
    participantId,
    name: payload.name?.trim() || "새 상품",
    sku: payload.sku?.trim() || null,
    priceAmount: payload.priceAmount ?? 0,
    status: payload.status ?? "active",
    createdAt: now,
    updatedAt: now,
  };

  getMockState().products.unshift(product);
  recordAuditLog({
    action: "create",
    category: "product",
    marketId,
    metadata: {
      name: product.name,
      participantId,
      priceAmount: product.priceAmount,
    },
    summary: `상품 ${product.name} 생성`,
    targetId: product.id,
    targetType: "product",
  });
  persistMockState();
  return product;
}

function updateProduct(productId: string, payload: UpdateProductPayload): Product {
  const product = findProduct(productId);
  const updatedProduct: Product = {
    ...product,
    name: payload.name !== undefined ? payload.name.trim() || product.name : product.name,
    priceAmount: payload.priceAmount ?? product.priceAmount,
    sku: payload.sku !== undefined ? payload.sku?.trim() || null : product.sku,
    status: payload.status ?? product.status,
    updatedAt: nowIsoString(),
  };

  replaceById(getMockState().products, productId, updatedProduct);
  recordAuditLog({
    action: "update",
    category: "product",
    marketId: updatedProduct.marketId,
    metadata: {
      changedFields: Object.keys(payload),
      name: updatedProduct.name,
      priceAmount: updatedProduct.priceAmount,
      status: updatedProduct.status,
    },
    summary: `상품 ${updatedProduct.name} 수정`,
    targetId: productId,
    targetType: "product",
  });
  persistMockState();
  return updatedProduct;
}

function createReceipt(marketId: string, payload: CreateReceiptPayload): Receipt {
  findMarket(marketId);
  const receipt = buildReceiptFromPayload(marketId, payload);
  getMockState().receipts.unshift(receipt);
  recordAuditLog({
    action: "create",
    category: "receipt",
    marketId,
    metadata: {
      paymentSplitCount: receipt.paymentSplits.length,
      receiptNo: receipt.receiptNo,
      saleLineCount: receipt.saleLines.length,
      totalAmount: receipt.totalAmount,
    },
    summary: `영수증 ${receipt.receiptNo ?? receipt.id} 저장`,
    targetId: receipt.id,
    targetType: "receipt",
  });
  persistMockState();
  return receipt;
}

function updateReceipt(receiptId: string, payload: UpdateReceiptPayload): Receipt {
  const existing = findReceipt(receiptId);
  const receipt = buildReceiptFromPayload(existing.marketId, payload, existing);
  replaceById(getMockState().receipts, receiptId, receipt);
  recordAuditLog({
    action: "update",
    category: "receipt",
    marketId: receipt.marketId,
    metadata: {
      changedFields: Object.keys(payload),
      paymentSplitCount: receipt.paymentSplits.length,
      receiptNo: receipt.receiptNo,
      saleLineCount: receipt.saleLines.length,
      totalAmount: receipt.totalAmount,
    },
    summary: `영수증 ${receipt.receiptNo ?? receipt.id} 수정`,
    targetId: receipt.id,
    targetType: "receipt",
  });
  persistMockState();
  return receipt;
}

function deleteReceipt(receiptId: string) {
  const state = getMockState();
  const receipt = findReceipt(receiptId);
  state.receipts = state.receipts.filter((item) => item.id !== receiptId);
  recordAuditLog({
    action: "remove",
    category: "receipt",
    marketId: receipt.marketId,
    metadata: {
      receiptNo: receipt.receiptNo,
      totalAmount: receipt.totalAmount,
    },
    summary: `영수증 ${receipt.receiptNo ?? receipt.id} 삭제`,
    targetId: receipt.id,
    targetType: "receipt",
  });
  persistMockState();
}

function updateGlobalSettlementSettings(
  payload: UpdateSettlementFeeSettingsPayload,
): SettlementDefaultSettings {
  const state = getMockState();
  state.globalSettlementSettings = {
    ...state.globalSettlementSettings,
    ...payload,
    updatedAt: nowIsoString(),
  };
  recordAuditLog({
    action: "update",
    category: "fee_policy",
    metadata: {
      ...payload,
      scope: "global",
    },
    summary: "전체 수수료 정책 수정",
    targetId: state.globalSettlementSettings.id ?? "global",
    targetType: "settlement_default_settings",
  });
  persistMockState();
  return state.globalSettlementSettings;
}

function updateMarketSettlementSettings(
  marketId: string,
  payload: UpdateSettlementFeeSettingsPayload,
): SettlementDefaultSettings {
  findMarket(marketId);
  const state = getMockState();
  const existingIndex = state.marketSettlementSettings.findIndex(
    (settings) => settings.marketId === marketId,
  );
  const existing =
    existingIndex >= 0
      ? state.marketSettlementSettings[existingIndex]
      : {
          ...state.globalSettlementSettings,
          id: createMockId("setting"),
          scope: "market" as const,
          marketId,
          createdAt: nowIsoString(),
        };
  const updated: SettlementDefaultSettings = {
    ...existing,
    ...payload,
    scope: "market",
    marketId,
    updatedAt: nowIsoString(),
  };

  if (existingIndex >= 0) {
    state.marketSettlementSettings[existingIndex] = updated;
  } else {
    state.marketSettlementSettings.unshift(updated);
  }

  recordAuditLog({
    action: "update",
    category: "fee_policy",
    marketId,
    metadata: {
      ...payload,
      scope: "market",
    },
    summary: `${FLEA_MARKET} 수수료 정책 수정`,
    targetId: updated.id ?? marketId,
    targetType: "settlement_default_settings",
  });
  persistMockState();
  return updated;
}

function buildReceiptFromPayload(
  marketId: string,
  payload: UpdateReceiptPayload,
  existing?: Receipt,
): Receipt {
  const now = nowIsoString();
  const receiptId = existing?.id ?? createMockId("receipt");
  const soldAt = payload.soldAt ?? existing?.soldAt ?? now;
  const saleLines =
    payload.saleLines?.map((saleLinePayload) => {
      const saleLineId = createMockId("saleLine");
      const items = saleLinePayload.items.map((itemPayload) => {
        const quantity = itemPayload.quantity ?? 1;
        const grossAmount = quantity * itemPayload.unitPriceAmount;
        const discountAmount = itemPayload.discountAmount ?? 0;
        const netAmount = Math.max(0, grossAmount - discountAmount);

        return {
          id: createMockId("saleLineItem"),
          saleLineId,
          productId: itemPayload.productId ?? null,
          itemName: itemPayload.itemName,
          quantity,
          unitPriceAmount: itemPayload.unitPriceAmount,
          grossAmount,
          discountAmount,
          netAmount,
          memo: itemPayload.memo ?? null,
          createdAt: existing?.createdAt ?? now,
          updatedAt: now,
        };
      });
      const grossAmount = items.reduce((sum, item) => sum + item.grossAmount, 0);
      const discountAmount = items.reduce(
        (sum, item) => sum + item.discountAmount,
        0,
      );
      const netAmount = items.reduce((sum, item) => sum + item.netAmount, 0);

      return {
        id: saleLineId,
        receiptId,
        participantId: saleLinePayload.participantId,
        grossAmount,
        discountAmount,
        netAmount,
        memo: saleLinePayload.memo ?? null,
        items,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };
    }) ?? existing?.saleLines ?? [];
  const subtotalAmount = saleLines.reduce(
    (sum, saleLine) => sum + saleLine.grossAmount,
    0,
  );
  const discountAmount = saleLines.reduce(
    (sum, saleLine) => sum + saleLine.discountAmount,
    0,
  );
  const totalAmount = saleLines.reduce((sum, saleLine) => sum + saleLine.netAmount, 0);

  return {
    id: receiptId,
    marketId,
    marketDayId: payload.marketDayId ?? existing?.marketDayId ?? null,
    receiptNo:
      payload.receiptNo !== undefined
        ? payload.receiptNo.trim() || null
        : existing?.receiptNo ?? null,
    customerLabel: existing?.customerLabel ?? null,
    soldAt,
    subtotalAmount,
    discountAmount,
    totalAmount,
    memo: payload.memo !== undefined ? payload.memo?.trim() || null : existing?.memo ?? null,
    createdBy: existing?.createdBy ?? getMockState().currentUser.id,
    paymentSplits:
      payload.paymentSplits?.map((paymentSplit) => ({
        id: createMockId("payment"),
        receiptId,
        paymentMethod: paymentSplit.paymentMethod,
        amount: paymentSplit.amount,
        referenceNo: paymentSplit.referenceNo ?? null,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      })) ??
      existing?.paymentSplits ??
      [],
    saleLines,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}

function buildSettlementPreview(marketId: string): MarketSettlementPreview {
  findMarket(marketId);
  const participants = getMockState()
    .marketParticipants.filter((participant) => participant.marketId === marketId)
    .sort((left, right) => left.displayName.localeCompare(right.displayName, "ko-KR"));
  const receipts = getMockState().receipts.filter(
    (receipt) => receipt.marketId === marketId,
  );
  const summaries = participants.map((participant) =>
    buildParticipantSettlementPreview(participant, receipts),
  );

  return {
    marketId,
    generatedAt: nowIsoString(),
    allocationPolicy: "line_net_amount_proportional",
    participantCount: summaries.length,
    receiptCount: receipts.length,
    saleLineCount: sumBy(summaries, "saleLineCount"),
    grossSalesAmount: sumBy(summaries, "grossSalesAmount"),
    discountAmount: sumBy(summaries, "discountAmount"),
    netSalesAmount: sumBy(summaries, "netSalesAmount"),
    cashSalesAmount: sumBy(summaries, "cashSalesAmount"),
    cardSalesAmount: sumBy(summaries, "cardSalesAmount"),
    transferSalesAmount: sumBy(summaries, "transferSalesAmount"),
    otherSalesAmount: sumBy(summaries, "otherSalesAmount"),
    salesCommissionAmount: sumBy(summaries, "salesCommissionAmount"),
    cardFeeAmount: sumBy(summaries, "cardFeeAmount"),
    cardFeeChargedToParticipantAmount: sumBy(
      summaries,
      "cardFeeChargedToParticipantAmount",
    ),
    cardFeePaidByMarketAmount: sumBy(summaries, "cardFeePaidByMarketAmount"),
    participationFeeAmount: sumBy(summaries, "participationFeeAmount"),
    marketIncomeAmount: sumBy(summaries, "marketIncomeAmount"),
    marketCostAmount: sumBy(summaries, "marketCostAmount"),
    marketProfitAmount: sumBy(summaries, "marketProfitAmount"),
    participantPayoutAmount: sumBy(summaries, "payoutAmount"),
    participants: summaries,
  };
}

function buildParticipantSettlementPreview(
  participant: Participant,
  receipts: Receipt[],
): ParticipantSettlementPreview & {
  marketCostAmount: number;
  marketIncomeAmount: number;
  marketProfitAmount: number;
} {
  const settings = resolveSettlementSettings(participant);
  const receiptIds = new Set<string>();
  const paymentAmounts: PaymentMethodAmounts = {
    cash: 0,
    card: 0,
    transfer: 0,
    other: 0,
  };
  let grossSalesAmount = 0;
  let discountAmount = 0;
  let netSalesAmount = 0;
  let saleLineCount = 0;

  for (const receipt of receipts) {
    for (const saleLine of receipt.saleLines) {
      if (saleLine.participantId !== participant.id) {
        continue;
      }

      receiptIds.add(receipt.id);
      saleLineCount += 1;
      grossSalesAmount += saleLine.grossAmount;
      discountAmount += saleLine.discountAmount;
      netSalesAmount += saleLine.netAmount;

      const ratio = receipt.totalAmount > 0 ? saleLine.netAmount / receipt.totalAmount : 0;

      for (const paymentSplit of receipt.paymentSplits) {
        paymentAmounts[paymentSplit.paymentMethod] += paymentSplit.amount * ratio;
      }
    }
  }

  const salesCommissionAmount = roundMoney(
    netSalesAmount * settings.salesCommissionRate,
  );
  const cardFeeAmount = roundMoney(paymentAmounts.card * settings.cardFeeRate);
  const cardFeeChargedToParticipantAmount =
    settings.cardFeePayer === "participant" ? cardFeeAmount : 0;
  const cardFeePaidByMarketAmount =
    settings.cardFeePayer === "market" ? cardFeeAmount : 0;
  const participationFeeAmount =
    saleLineCount > 0 && participant.participantType !== "staff"
      ? settings.participationFeeAmount
      : 0;
  const marketIncomeAmount =
    salesCommissionAmount +
    cardFeeChargedToParticipantAmount +
    participationFeeAmount;
  const marketCostAmount = cardFeePaidByMarketAmount;
  const payoutAmount =
    netSalesAmount -
    salesCommissionAmount -
    cardFeeChargedToParticipantAmount -
    participationFeeAmount;

  return {
    participantId: participant.id,
    displayName: participant.displayName,
    participantType: participant.participantType,
    settlementType: settings.settlementType,
    receiptCount: receiptIds.size,
    saleLineCount,
    grossSalesAmount: roundMoney(grossSalesAmount),
    discountAmount: roundMoney(discountAmount),
    netSalesAmount: roundMoney(netSalesAmount),
    cashSalesAmount: roundMoney(paymentAmounts.cash),
    cardSalesAmount: roundMoney(paymentAmounts.card),
    transferSalesAmount: roundMoney(paymentAmounts.transfer),
    otherSalesAmount: roundMoney(paymentAmounts.other),
    salesCommissionRate: settings.salesCommissionRate,
    salesCommissionAmount,
    cardFeeRate: settings.cardFeeRate,
    cardFeePayer: settings.cardFeePayer,
    cardFeeAmount,
    cardFeeChargedToParticipantAmount,
    cardFeePaidByMarketAmount,
    participationFeeAmount,
    marketIncomeAmount,
    marketCostAmount,
    marketProfitAmount: marketIncomeAmount - marketCostAmount,
    payoutAmount: roundMoney(payoutAmount),
  };
}

function createSettlement(marketId: string, payload: { memo?: string }): Settlement {
  const state = getMockState();
  const preview = buildSettlementPreview(marketId);
  const now = nowIsoString();
  const previousSettlements = state.settlements.filter(
    (settlement) => settlement.marketId === marketId,
  );
  const baseSettlement = [...previousSettlements].sort(
    (left, right) => right.versionNo - left.versionNo,
  )[0];

  if (baseSettlement && baseSettlement.status === "confirmed") {
    baseSettlement.status = "superseded";
    baseSettlement.updatedAt = now;
  }

  const settlementId = createMockId("settlement");
  const settlement: Settlement = {
    ...preview,
    id: settlementId,
    versionNo: (baseSettlement?.versionNo ?? 0) + 1,
    baseSettlementId: baseSettlement?.id ?? null,
    status: "confirmed",
    memo: payload.memo?.trim() || null,
    confirmedBy: state.currentUser.id,
    confirmedAt: now,
    createdAt: now,
    updatedAt: now,
    participants: preview.participants.map((participant) =>
      toSettlementParticipantSnapshot(settlementId, participant, now),
    ),
    changes: [
      {
        id: createMockId("settlementChange"),
        settlementId,
        baseSettlementId: baseSettlement?.id ?? null,
        changeType: baseSettlement ? "revision_confirmation" : "initial_confirmation",
        description: payload.memo?.trim() || null,
        amountDeltas: {},
        createdBy: state.currentUser.id,
        createdAt: now,
      },
    ],
  };

  state.settlements.unshift(settlement);
  recordAuditLog({
    action: "confirm",
    category: "settlement",
    marketId,
    metadata: {
      netSalesAmount: settlement.netSalesAmount,
      participantCount: settlement.participantCount,
      participantPayoutAmount: settlement.participantPayoutAmount,
      receiptCount: settlement.receiptCount,
      versionNo: settlement.versionNo,
    },
    summary: `정산 v${settlement.versionNo} 확정`,
    targetId: settlement.id,
    targetType: "settlement",
  });
  persistMockState();
  return settlement;
}

function voidSettlement(
  settlementId: string,
  payload: { memo?: string },
): Settlement {
  const settlement = findSettlement(settlementId);
  const now = nowIsoString();
  const updated: Settlement = {
    ...settlement,
    status: "voided",
    updatedAt: now,
    changes: [
      ...settlement.changes,
      {
        id: createMockId("settlementChange"),
        settlementId,
        baseSettlementId: settlement.baseSettlementId,
        changeType: "manual_note",
        description: payload.memo?.trim() || "mock 모드에서 정산을 무효 처리했습니다.",
        amountDeltas: {},
        createdBy: getMockState().currentUser.id,
        createdAt: now,
      },
    ],
  };

  replaceById(getMockState().settlements, settlementId, updated);
  recordAuditLog({
    action: "void",
    category: "settlement",
    marketId: updated.marketId,
    metadata: {
      memoProvided: Boolean(payload.memo?.trim()),
      participantPayoutAmount: updated.participantPayoutAmount,
      versionNo: updated.versionNo,
    },
    summary: `정산 v${updated.versionNo} 무효 처리`,
    targetId: updated.id,
    targetType: "settlement",
  });
  persistMockState();
  return updated;
}

function listAuditLogs(url: URL): AuditLogListResponse {
  const params = Object.fromEntries(url.searchParams.entries()) as AuditLogListParams & {
    actorUserId?: string;
  };
  const fromTime = params.from ? Date.parse(params.from) : null;
  const toTime = params.to ? Date.parse(params.to) : null;
  const search = params.search?.trim().toLowerCase();
  const limit = Math.min(Number(params.limit ?? 80) || 80, 100);
  const logs = getMockState().auditLogs
    .filter((log) => {
      if (params.marketId && log.marketId !== params.marketId) {
        return false;
      }

      if (params.category && log.category !== params.category) {
        return false;
      }

      if (params.action && log.action !== params.action) {
        return false;
      }

      if (params.result && log.result !== params.result) {
        return false;
      }

      if (params.actorUserId && log.actorUserId !== params.actorUserId) {
        return false;
      }

      const occurredAt = Date.parse(log.occurredAt);

      if (fromTime && occurredAt < fromTime) {
        return false;
      }

      if (toTime && occurredAt > toTime) {
        return false;
      }

      if (!search) {
        return true;
      }

      return [log.summary, log.targetId, log.targetType, JSON.stringify(log.metadata)]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(search));
    })
    .sort((left, right) => Date.parse(right.occurredAt) - Date.parse(left.occurredAt))
    .slice(0, limit);

  return { logs };
}

function findMarket(marketId: string): Market {
  const market = getMockState().markets.find((item) => item.id === marketId);

  if (!market) {
    throw notFound("Market not found.");
  }

  return market;
}

function findParticipantMaster(participantId: string): Participant {
  const participant = getMockState().participantMasters.find(
    (item) => item.id === participantId,
  );

  if (!participant) {
    throw notFound("Participant not found.");
  }

  return participant;
}

function findProduct(productId: string): Product {
  const product = getMockState().products.find((item) => item.id === productId);

  if (!product) {
    throw notFound("Product not found.");
  }

  return product;
}

function findReceipt(receiptId: string): Receipt {
  const receipt = getMockState().receipts.find((item) => item.id === receiptId);

  if (!receipt) {
    throw notFound("Receipt not found.");
  }

  return receipt;
}

function findSettlement(settlementId: string): Settlement {
  const settlement = getMockState().settlements.find(
    (item) => item.id === settlementId,
  );

  if (!settlement) {
    throw notFound("Settlement not found.");
  }

  return settlement;
}

function findMarketSettlementSettings(marketId: string): SettlementDefaultSettings {
  findMarket(marketId);
  const settings = getMockState().marketSettlementSettings.find(
    (item) => item.marketId === marketId,
  );

  if (settings) {
    return settings;
  }

  const globalSettings = getMockState().globalSettlementSettings;
  return {
    ...globalSettings,
    id: null,
    scope: "market",
    marketId,
    createdAt: null,
    updatedAt: null,
  };
}

function resolveSettlementSettings(participant: Participant): SettlementFeeSettings {
  const marketId = participant.marketId;
  const fallback = marketId
    ? findMarketSettlementSettings(marketId)
    : getMockState().globalSettlementSettings;
  const settings = participant.settings;

  if (
    settings?.feeSettingOverrideEnabled &&
    settings.settlementType &&
    settings.salesCommissionRate !== null &&
    settings.cardFeeRate !== null &&
    settings.cardFeePayer &&
    settings.participationFeeAmount !== null
  ) {
    return {
      settlementType: settings.settlementType,
      salesCommissionRate: settings.salesCommissionRate,
      cardFeeRate: settings.cardFeeRate,
      cardFeePayer: settings.cardFeePayer,
      participationFeeAmount: settings.participationFeeAmount,
    };
  }

  return {
    settlementType: fallback.settlementType,
    salesCommissionRate: fallback.salesCommissionRate,
    cardFeeRate: fallback.cardFeeRate,
    cardFeePayer: fallback.cardFeePayer,
    participationFeeAmount: fallback.participationFeeAmount,
  };
}

function buildParticipantSettings({
  marketId,
  marketParticipantId,
  participantId,
  payload,
  now,
}: {
  marketId: string;
  marketParticipantId: string;
  participantId: string;
  payload: CreateParticipantPayload | UpdateParticipantPayload;
  now: string;
}): NonNullable<Participant["settings"]> {
  const overrideEnabled = payload.feeSettingOverrideEnabled ?? hasFeeSettingInput(payload);

  return {
    id: marketParticipantId,
    marketParticipantId,
    participantId,
    marketId,
    feeSettingOverrideEnabled: overrideEnabled,
    settlementType: overrideEnabled ? (payload.settlementType ?? "commission") : null,
    salesCommissionRate: overrideEnabled ? (payload.salesCommissionRate ?? 0) : null,
    cardFeeRate: overrideEnabled ? (payload.cardFeeRate ?? 0) : null,
    cardFeePayer: overrideEnabled ? (payload.cardFeePayer ?? "market") : null,
    participationFeeAmount: overrideEnabled
      ? (payload.participationFeeAmount ?? 0)
      : null,
    payoutBankName: null,
    payoutAccountNumber: null,
    payoutAccountHolder: null,
    createdAt: now,
    updatedAt: now,
  };
}

function updateParticipantSettings(
  participant: Participant,
  payload: CreateParticipantPayload | UpdateParticipantPayload,
  now: string,
): NonNullable<Participant["settings"]> {
  const current =
    participant.settings ??
    buildParticipantSettings({
      marketId: participant.marketId ?? "",
      marketParticipantId: participant.marketParticipantId ?? createMockId("marketParticipant"),
      participantId: participant.id,
      payload: {},
      now,
    });
  const nextOverrideEnabled =
    payload.feeSettingOverrideEnabled ?? current.feeSettingOverrideEnabled;

  if (!nextOverrideEnabled) {
    return {
      ...current,
      feeSettingOverrideEnabled: false,
      settlementType: null,
      salesCommissionRate: null,
      cardFeeRate: null,
      cardFeePayer: null,
      participationFeeAmount: null,
      updatedAt: now,
    };
  }

  return {
    ...current,
    feeSettingOverrideEnabled: true,
    settlementType: payload.settlementType ?? current.settlementType ?? "commission",
    salesCommissionRate:
      payload.salesCommissionRate ?? current.salesCommissionRate ?? 0,
    cardFeeRate: payload.cardFeeRate ?? current.cardFeeRate ?? 0,
    cardFeePayer: payload.cardFeePayer ?? current.cardFeePayer ?? "market",
    participationFeeAmount:
      payload.participationFeeAmount ?? current.participationFeeAmount ?? 0,
    updatedAt: now,
  };
}

function hasFeeSettingInput(
  payload: CreateParticipantPayload | UpdateParticipantPayload,
): boolean {
  return (
    payload.settlementType !== undefined ||
    payload.salesCommissionRate !== undefined ||
    payload.cardFeeRate !== undefined ||
    payload.cardFeePayer !== undefined ||
    payload.participationFeeAmount !== undefined
  );
}

function syncParticipantMasterFields(updatedParticipant: Participant) {
  const state = getMockState();
  state.marketParticipants = state.marketParticipants.map((participant) =>
    participant.id === updatedParticipant.id
      ? {
          ...participant,
          contactName: updatedParticipant.contactName,
          displayName: updatedParticipant.displayName,
          email: updatedParticipant.email,
          memo: updatedParticipant.memo,
          phone: updatedParticipant.phone,
          updatedAt: updatedParticipant.updatedAt,
        }
      : participant,
  );
}

function toSettlementParticipantSnapshot(
  settlementId: string,
  participant: ParticipantSettlementPreview,
  now: string,
): SettlementParticipantSnapshot {
  return {
    ...participant,
    id: createMockId("settlementParticipant"),
    settlementId,
    participantId: participant.participantId,
    createdAt: now,
    updatedAt: now,
  };
}

function toSettlementListItem(settlement: Settlement): SettlementListItem {
  const { participants, changes, ...listItem } = settlement;
  void participants;
  void changes;
  return listItem;
}

function recordAuditLog(input: {
  action: AuditLogAction;
  category: AuditLogCategory;
  marketId?: string | null;
  metadata?: unknown;
  result?: AuditLogResult;
  summary: string;
  targetId?: string | null;
  targetType?: string | null;
}) {
  const state = getMockState();
  const now = nowIsoString();
  const auditLog: AuditLog = {
    id: createMockId("audit"),
    occurredAt: now,
    actorUserId: state.currentUser.id,
    actorDisplayName: state.currentUser.displayName,
    actorRole: state.currentUser.role,
    category: input.category,
    action: input.action,
    result: input.result ?? "success",
    marketId: input.marketId ?? null,
    targetType: input.targetType ?? null,
    targetId: input.targetId ?? null,
    summary: input.summary,
    metadata: input.metadata ?? {},
    ipAddress: "127.0.0.1",
    userAgent: "Mock browser",
    requestId: null,
    createdAt: now,
  };

  state.auditLogs.unshift(auditLog);
}

function readJsonBody<T>(init: RequestInit): T {
  if (typeof init.body !== "string" || init.body.trim().length === 0) {
    return {} as T;
  }

  return JSON.parse(init.body) as T;
}

function createMockUrl(path: string): URL {
  return new URL(path, "http://mock.local");
}

function getMethod(init: RequestInit): string {
  return (init.method ?? "GET").toUpperCase();
}

function replaceById<TItem extends { id: string }>(
  items: TItem[],
  id: string,
  updatedItem: TItem,
) {
  const index = items.findIndex((item) => item.id === id);

  if (index < 0) {
    throw notFound("Resource not found.");
  }

  items[index] = updatedItem;
}

function sumBy<TKey extends keyof ParticipantSettlementPreviewWithMarket>(
  participants: ParticipantSettlementPreviewWithMarket[],
  key: TKey,
): number {
  return roundMoney(
    participants.reduce((sum, participant) => {
      const value = participant[key];
      return sum + (typeof value === "number" ? value : 0);
    }, 0),
  );
}

function roundMoney(value: number): number {
  return Math.round(value);
}

function compareUpdatedDesc(left: { updatedAt: string }, right: { updatedAt: string }) {
  return Date.parse(right.updatedAt) - Date.parse(left.updatedAt);
}

function compareSoldAtDesc(left: Receipt, right: Receipt) {
  return Date.parse(right.soldAt) - Date.parse(left.soldAt);
}

function assertMockAdmin() {
  const state = getMockState();

  if (!state.isAuthenticated) {
    throw unauthorized("Authentication is required.");
  }

  if (state.currentUser.role !== "admin") {
    throw forbidden("Only admins can manage invitations.");
  }
}

function createMockInviteUrl(invitationId: string): string {
  const origin =
    typeof window === "undefined"
      ? "http://localhost:3002"
      : window.location.origin;
  const url = new URL("/join", origin);
  url.searchParams.set("token", `${"x".repeat(48)}.${invitationId}`);

  return url.toString();
}

function findActiveMockInvitation(token: string | undefined): Invitation {
  const invitationId = token?.split(".").at(-1);
  const invitation = getMockState().signupInvitations.find(
    (candidate) => candidate.id === invitationId,
  );

  if (!invitation || getMockInvitationStatus(invitation) !== "pending") {
    throw badRequest("Invitation is invalid or expired.");
  }

  return invitation;
}

function getMockInvitationStatus(
  invitation: Invitation,
): Invitation["status"] {
  if (invitation.usedAt) {
    return "accepted";
  }

  if (invitation.revokedAt) {
    return "revoked";
  }

  if (Date.parse(invitation.expiresAt) <= Date.now()) {
    return "expired";
  }

  return "pending";
}

function maskMockEmail(email: string): string {
  const [localPart, domain] = email.split("@");
  if (!localPart || !domain) {
    return "***";
  }

  const visible = localPart.slice(0, Math.min(2, localPart.length));

  return `${visible}${"*".repeat(Math.max(3, localPart.length - visible.length))}@${domain}`;
}

function notFound(message: string): MockApiError {
  return new MockApiError(404, message, { message, statusCode: 404 });
}

function badRequest(message: string): MockApiError {
  return new MockApiError(400, message, { message, statusCode: 400 });
}

function unauthorized(message: string): MockApiError {
  return new MockApiError(401, message, { message, statusCode: 401 });
}

function forbidden(message: string): MockApiError {
  return new MockApiError(403, message, { message, statusCode: 403 });
}

function conflict(message: string): MockApiError {
  return new MockApiError(409, message, { message, statusCode: 409 });
}
