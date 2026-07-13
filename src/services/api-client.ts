const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";
const DATA_SOURCE = process.env.NEXT_PUBLIC_DATA_SOURCE ?? "mock";

type ApiRequestOptions = {
  auth?: "auto" | "skip";
};

type AuthExpiredListener = () => void;

type ApiErrorBody = {
  message?: string | string[];
  error?: string;
  statusCode?: number;
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: ApiErrorBody | null,
  ) {
    super(message);
  }
}

export type ApiDownloadResult = {
  blob: Blob;
  filename: string;
};

const authExpiredListeners = new Set<AuthExpiredListener>();
let refreshRequest: Promise<boolean> | null = null;

export function subscribeToAuthExpiration(
  listener: AuthExpiredListener,
): () => void {
  authExpiredListeners.add(listener);

  return () => {
    authExpiredListeners.delete(listener);
  };
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  options: ApiRequestOptions = {},
): Promise<T> {
  if (isMockDataSource()) {
    const { handleMockApiRequest } = await import("@/mocks/mock-api");
    return handleMockApiRequest<T>(path, init);
  }

  const response = await fetchWithSession(path, init, options);

  if (!response.ok) {
    const body = await parseErrorBody(response);
    throw new ApiError(getErrorMessage(body, response.status), response.status, body);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function apiDownload(
  path: string,
  fallbackFilename: string,
  init: RequestInit = {},
): Promise<ApiDownloadResult> {
  if (isMockDataSource()) {
    const { handleMockApiDownload } = await import("@/mocks/mock-api");
    return handleMockApiDownload(path, fallbackFilename);
  }

  const response = await fetchWithSession(
    path,
    { ...init, cache: "no-store" },
    { auth: "auto" },
  );

  if (!response.ok) {
    const body = await parseErrorBody(response);
    throw new ApiError(getErrorMessage(body, response.status), response.status, body);
  }

  const blob = await response.blob();

  if (!blob || blob.size === 0) {
    throw new Error("생성된 파일이 비어 있습니다.");
  }

  return {
    blob,
    filename:
      resolveFilenameFromDisposition(response.headers.get("Content-Disposition")) ??
      fallbackFilename,
  };
}

function isMockDataSource(): boolean {
  return DATA_SOURCE === "mock";
}

async function fetchWithSession(
  path: string,
  init: RequestInit,
  options: ApiRequestOptions,
): Promise<Response> {
  const request = createApiRequest(path, init);
  const retryRequest = request.clone();
  const response = await fetch(request);

  if (response.status !== 401 || options.auth === "skip") {
    return response;
  }

  const refreshed = await refreshAccessToken();
  if (!refreshed) {
    return response;
  }

  const retryResponse = await fetch(retryRequest);
  if (retryResponse.status === 401) {
    notifyAuthExpired();
  }

  return retryResponse;
}

function createApiRequest(path: string, init: RequestInit): Request {
  const headers = new Headers(init.headers);

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return new Request(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers,
  });
}

async function refreshAccessToken(): Promise<boolean> {
  if (refreshRequest) {
    return refreshRequest;
  }

  const pendingRequest = performRefresh();
  refreshRequest = pendingRequest;

  try {
    return await pendingRequest;
  } finally {
    if (refreshRequest === pendingRequest) {
      refreshRequest = null;
    }
  }
}

async function performRefresh(): Promise<boolean> {
  const response = await fetch(
    createApiRequest("/auth/refresh", { method: "POST" }),
  );

  if (response.ok) {
    return true;
  }

  if (response.status === 401 || response.status === 403) {
    notifyAuthExpired();
    return false;
  }

  const body = await parseErrorBody(response);
  throw new ApiError(getErrorMessage(body, response.status), response.status, body);
}

function notifyAuthExpired(): void {
  for (const listener of authExpiredListeners) {
    listener();
  }
}

async function parseErrorBody(response: Response): Promise<ApiErrorBody | null> {
  try {
    return (await response.json()) as ApiErrorBody;
  } catch {
    return null;
  }
}

function getErrorMessage(body: ApiErrorBody | null, status: number): string {
  if (Array.isArray(body?.message)) {
    return body.message.join(", ");
  }

  if (body?.message) {
    return body.message;
  }

  return `Request failed with status ${status}`;
}

function resolveFilenameFromDisposition(
  contentDisposition: string | null,
): string | null {
  if (!contentDisposition) {
    return null;
  }

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]).trim();
    } catch {
      return utf8Match[1].trim();
    }
  }

  const plainMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  return plainMatch?.[1]?.trim() ?? null;
}
