import { getApiUrl } from "@/lib/config"

interface ProblemDetails {
  title?: string
  detail?: string
  code?: string
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string
  ) {
    super(message)
  }
}

let refreshPromise: Promise<boolean> | null = null

async function refreshSession(): Promise<boolean> {
  refreshPromise ??= fetch(getApiUrl("/auth/refresh"), {
    method: "POST",
    credentials: "include",
  })
    .then((response) => response.ok)
    .catch(() => false)
    .finally(() => {
      refreshPromise = null
    })
  return refreshPromise
}

async function request<T>(path: string, options: RequestInit = {}, canRefresh = true): Promise<T> {
  const headers = new Headers(options.headers)
  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json")
  }
  const response = await fetch(getApiUrl(path), {
    ...options,
    headers,
    credentials: "include",
  })
  if (response.status === 401 && canRefresh && !path.startsWith("/auth/")) {
    if (await refreshSession()) return request<T>(path, options, false)
  }
  if (!response.ok) {
    const problem = (await response.json().catch(() => ({}))) as ProblemDetails
    throw new ApiError(
      response.status,
      problem.code ?? "REQUEST_FAILED",
      problem.detail ?? problem.title ?? response.statusText
    )
  }
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

export const api = {
  get: <T>(path: string, init: RequestInit = {}) => request<T>(path, init),
  post: <T>(path: string, body?: unknown, init: RequestInit = {}) =>
    request<T>(path, {
      ...init,
      method: "POST",
      body: body instanceof FormData ? body : body === undefined ? undefined : JSON.stringify(body),
    }),
  patch: <T>(path: string, body?: unknown, init: RequestInit = {}) =>
    request<T>(path, {
      ...init,
      method: "PATCH",
      body: body instanceof FormData ? body : body === undefined ? undefined : JSON.stringify(body),
    }),
  put: <T>(path: string, body?: unknown, init: RequestInit = {}) =>
    request<T>(path, {
      ...init,
      method: "PUT",
      body: body instanceof FormData ? body : body === undefined ? undefined : JSON.stringify(body),
    }),
  del: <T>(path: string, init: RequestInit = {}) => request<T>(path, { ...init, method: "DELETE" }),
}
