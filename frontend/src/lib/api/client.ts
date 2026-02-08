const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
  const headers: HeadersInit = { ...(options.headers || {}) }
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json"
  }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(text || res.statusText)
  }
  return (await res.json()) as T
}

export const api = {
  get: request,
  post: <T>(path: string, body?: unknown, init: RequestInit = {}) =>
    request<T>(path, {
      method: "POST",
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
      ...init,
    }),
  patch: <T>(path: string, body?: unknown, init: RequestInit = {}) =>
    request<T>(path, {
      method: "PATCH",
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
      ...init,
    }),
  del: <T>(path: string, init: RequestInit = {}) =>
    request<T>(path, { method: "DELETE", ...init }),
}
