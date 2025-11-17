/**
 * Fetches a resource with a timeout using native AbortController.
 * Addresses security concern LOW-003: No explicit timeout configuration for external calls.
 *
 * @param params - Fetch parameters
 * @param params.url - URL to fetch
 * @param params.options - Fetch options (headers, method, body, etc.)
 * @param params.timeoutMs - Timeout in milliseconds (default: 5000)
 * @returns Promise that resolves with the Response or rejects on timeout
 *
 * @example
 * ```ts
 * const response = await fetchWithTimeout({
 *   url: 'https://api.example.com/data',
 *   options: { headers: { Authorization: 'Bearer token' } },
 *   timeoutMs: 10000
 * })
 * ```
 */
export async function fetchWithTimeout({
  url,
  options = {},
  timeoutMs = 5000,
}: {
  url: string
  options?: RequestInit
  timeoutMs?: number
}): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    // ts-reset makes fetch return unknown, but we know it's Response
    // Type assertion is safe here because fetch always returns Response
    const response = (await fetch(url, {
      ...options,
      signal: controller.signal,
    })) as Response
    return response
  } finally {
    clearTimeout(timeoutId)
  }
}
