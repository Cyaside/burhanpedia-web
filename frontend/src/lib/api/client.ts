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
  if (res.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token")
      window.location.assign("/login")
    }
    throw new Error("Unauthorized")
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    let message = text || res.statusText
    try {
      const parsed = JSON.parse(text)
      if (parsed?.message) {
        message = Array.isArray(parsed.message) ? parsed.message.join(", ") : parsed.message
      } else if (parsed?.error) {
        message = parsed.error
      }
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(message || res.statusText)
  }
  const contentType = res.headers.get("content-type") || ""
  if (contentType.includes("application/json")) {
    return (await res.json()) as T
  }
  const bodyText = await res.text().catch(() => "")
  throw new Error(`Expected JSON response but received: ${bodyText.slice(0,200)}`)
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
