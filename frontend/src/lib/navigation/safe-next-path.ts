const BASE_URL = "https://burhanpedia.invalid"
const FALLBACK_PATH = "/dashboard"

export function safeNextPath(value: string | null): string {
  if (!value?.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return FALLBACK_PATH
  }

  try {
    const url = new URL(value, BASE_URL)
    if (url.origin !== BASE_URL || /%(?:2f|5c|25)/i.test(url.pathname)) {
      return FALLBACK_PATH
    }
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return FALLBACK_PATH
  }
}
