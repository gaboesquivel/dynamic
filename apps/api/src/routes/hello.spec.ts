import { describe, it, expect } from 'vitest'
import { helloRoute } from './hello'
import { testRoute } from '../test/utils/elysia'

describe('helloRoute', () => {
  it('should return hello message via HTTP endpoint', async () => {
    // Blackbox test: hit HTTP endpoint, not internal handler
    const response = await testRoute(helloRoute, {
      method: 'GET',
      path: '/hello',
    })
    const data = await response.json()

    // Validate response matches contract
    expect(response.status).toBe(200)
    expect(data).toEqual({ message: 'Hello, World!' })
  })
})
