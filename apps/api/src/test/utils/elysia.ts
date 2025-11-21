import type { Elysia } from 'elysia'

/**
 * Creates an Elysia app instance for blackbox testing.
 * Tests use this to simulate HTTP requests via app.handle()
 */
export function createTestApp(routes: Elysia): Elysia {
  return routes
}

/**
 * Helper for testing Elysia routes via HTTP endpoints (blackbox testing).
 * Tests hit HTTP endpoints only, not internal implementation.
 *
 * @example
 * ```typescript
 * import { describe, it, expect } from 'vitest'
 * import { helloRoute } from '../routes/hello'
 * import { testRoute } from './utils/elysia'
 *
 * describe('helloRoute', () => {
 *   it('should return hello message via HTTP endpoint', async () => {
 *     const response = await testRoute(helloRoute, {
 *       method: 'GET',
 *       path: '/hello',
 *     })
 *     const data = await response.json()
 *     expect(data).toEqual({ message: 'Hello, World!' })
 *   })
 * })
 * ```
 */
export async function testRoute(
  route: Elysia,
  options: { method: string; path: string; body?: unknown; headers?: HeadersInit },
): Promise<Response> {
  const app = createTestApp(route)
  const url = `http://localhost${options.path}`
  const init: RequestInit = {
    method: options.method,
    headers: options.headers,
  }

  if (options.body) {
    init.body = JSON.stringify(options.body)
    init.headers = {
      ...init.headers,
      'Content-Type': 'application/json',
    }
  }

  return app.handle(new Request(url, init))
}

/**
 * Helper for testing route handlers via app.handle() (blackbox testing).
 * Maintains blackbox approach while testing Elysia routes.
 */
export async function testHandler(route: Elysia, request: Request): Promise<Response> {
  const app = createTestApp(route)
  return app.handle(request)
}
