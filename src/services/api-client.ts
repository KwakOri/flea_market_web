const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";
const DATA_SOURCE = process.env.NEXT_PUBLIC_DATA_SOURCE ?? "api";

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

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  if (isMockDataSource()) {
    const { handleMockApiRequest } = await import("@/mocks/mock-api");
    return handleMockApiRequest<T>(path, init);
  }

  const headers = new Headers(init.headers);

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers,
  });

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

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    cache: "no-store",
    credentials: "include",
  });

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
