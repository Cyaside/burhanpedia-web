const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
  // Use the Headers API to safely set header values (avoids TS index errors)
  const hdrs = new Headers(options.headers as HeadersInit)
  if (!(options.body instanceof FormData)) {
    hdrs.set("Content-Type", "application/json")
  }
  if (token) hdrs.set("Authorization", `Bearer ${token}`)

  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: hdrs,
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
