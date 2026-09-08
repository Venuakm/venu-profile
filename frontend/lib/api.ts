export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type RequestOptions = RequestInit & { json?: unknown };

/**
 * Thin fetch wrapper. Cookies carry the session, and every mutating call sends
 * the header the API requires as its CSRF signal.
 */
export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { json, headers, ...rest } = options;
  const method = (rest.method ?? (json ? "POST" : "GET")).toUpperCase();

  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    method,
    credentials: "include",
    headers: {
      ...(json ? { "Content-Type": "application/json" } : {}),
      "X-Requested-With": "venu-admin",
      ...headers,
    },
    body: json ? JSON.stringify(json) : rest.body,
  });

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload && "error" in payload
        ? String((payload as { error: string }).error)
        : `Request failed (${response.status})`;
    throw new ApiError(message, response.status);
  }

  return payload as T;
}

/** Server-side fetch used by the public pages. Never throws - falls back to null. */
export async function fetchPublic<T>(path: string, revalidate = 30): Promise<T | null> {
  try {
    const response = await fetch(`${API_URL}${path}`, {
      next: { revalidate },
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}
