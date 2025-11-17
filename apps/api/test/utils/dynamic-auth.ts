let cachedToken: string | null = null
let cachedExpiry: number | null = null

export async function getTestAuthToken(): Promise<string> {
  const environmentId = process.env.DYNAMIC_ENVIRONMENT_ID
  const apiToken = process.env.DYNAMIC_API_TOKEN
  const testAuthToken = process.env.TEST_AUTH_TOKEN

  // If TEST_AUTH_TOKEN is provided, use it directly (for CI/testing)
  if (testAuthToken) {
    return testAuthToken
  }

  if (!environmentId || !apiToken) {
    throw new Error(
      'DYNAMIC_ENVIRONMENT_ID and DYNAMIC_API_TOKEN must be set in environment variables. For automated testing, you can also set TEST_AUTH_TOKEN.',
    )
  }

  // Return cached token if still valid (with 5 minute buffer)
  if (cachedToken && cachedExpiry && Date.now() < cachedExpiry - 5 * 60 * 1000) {
    return cachedToken
  }

  try {
    // For automated testing, use Dynamic's REST API directly
    // Create a test user and then create a session to get JWT token
    const testEmail = `test-${Date.now()}-${Math.random().toString(36).substring(7)}@test.vencura.com`

    // Step 1: Create or get user
    let userId: string | undefined

    const createUserResponse = await fetch(
      `https://app.dynamicauth.com/api/v0/environments/${environmentId}/users`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiToken}`,
        },
        body: JSON.stringify({
          email: testEmail,
        }),
      },
    )

    if (createUserResponse.ok) {
      const userData = (await createUserResponse.json()) as Record<string, unknown>
      // Extract userId from response - Dynamic API returns { user: { id: "..." } }
      userId =
        ((userData.user as Record<string, unknown>)?.id as string | undefined) ||
        (userData.userId as string | undefined) ||
        (userData.id as string | undefined) ||
        ((userData.user as Record<string, unknown>)?.userId as string | undefined) ||
        ((userData.data as Record<string, unknown>)?.userId as string | undefined) ||
        (userData.user_id as string | undefined)
    } else if (createUserResponse.status === 409) {
      // User exists, try to find them
      const searchResponse = await fetch(
        `https://app.dynamicauth.com/api/v0/environments/${environmentId}/users?email=${encodeURIComponent(testEmail)}`,
        {
          headers: {
            Authorization: `Bearer ${apiToken}`,
          },
        },
      )
      if (searchResponse.ok) {
        const searchData = (await searchResponse.json()) as Record<string, unknown>
        const users = (
          Array.isArray(searchData)
            ? searchData
            : (searchData.users as unknown[]) || (searchData.data as unknown[]) || []
        ) as Array<Record<string, unknown>>
        if (users.length > 0) {
          userId =
            (users[0].userId as string | undefined) ||
            (users[0].id as string | undefined) ||
            (users[0].user_id as string | undefined)
        }
      }
    }

    if (!userId) {
      // Try to get response body for better error message
      let errorText = 'Unknown error'
      try {
        const errorData = await createUserResponse.json()
        errorText = JSON.stringify(errorData)
      } catch {
        errorText = await createUserResponse.text().catch(() => 'Unknown error')
      }
      throw new Error(
        `Failed to extract userId from user creation response (${createUserResponse.status}): ${errorText}`,
      )
    }

    // Step 2: Create session to get JWT token
    // Try different possible session endpoints
    let sessionResponse: Response | null = null
    let sessionData: Record<string, unknown> | null = null

    // Try endpoint: /sessions
    sessionResponse = await fetch(
      `https://app.dynamicauth.com/api/v0/environments/${environmentId}/sessions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiToken}`,
        },
        body: JSON.stringify({
          userId,
        }),
      },
    )

    if (!sessionResponse.ok && sessionResponse.status === 404) {
      // Try alternative endpoint: /users/{userId}/sessions
      sessionResponse = await fetch(
        `https://app.dynamicauth.com/api/v0/environments/${environmentId}/users/${userId}/sessions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiToken}`,
          },
          body: JSON.stringify({}),
        },
      )
    }

    if (!sessionResponse.ok) {
      const errorText = await sessionResponse.text()
      // If session creation fails, try using ExternalJwtApi to generate a test JWT
      console.warn(
        `Session creation failed (${sessionResponse.status}): ${errorText}. Trying ExternalJwtApi...`,
      )

      try {
        const sdkApi = await import('@dynamic-labs/sdk-api')
        const { ExternalJwtApi, Configuration } = sdkApi
        const config = new Configuration({
          accessToken: apiToken,
        })
        const externalJwtApi = new ExternalJwtApi(config)

        const jwtResponse = await externalJwtApi.createExternalJwt({
          environmentId,
          createExternalJwtRequest: {
            userId,
          },
        })

        const token = jwtResponse.token || jwtResponse.jwt || jwtResponse.accessToken
        if (token) {
          cachedToken = token
          cachedExpiry = Date.now() + 3600 * 1000
          return cachedToken
        }
      } catch (jwtError) {
        throw new Error(
          `Failed to create session or JWT: ${sessionResponse.status} ${errorText}. ExternalJwtApi also failed: ${jwtError instanceof Error ? jwtError.message : String(jwtError)}`,
        )
      }

      throw new Error(`Failed to create session: ${sessionResponse.status} ${errorText}`)
    }

    sessionData = (await sessionResponse.json()) as Record<string, unknown>

    // Extract token from various possible response structures
    const token =
      (sessionData.accessToken as string | undefined) ||
      (sessionData.token as string | undefined) ||
      (sessionData.jwt as string | undefined) ||
      ((sessionData.session as Record<string, unknown>)?.accessToken as string | undefined) ||
      ((sessionData.data as Record<string, unknown>)?.accessToken as string | undefined) ||
      ((sessionData.data as Record<string, unknown>)?.token as string | undefined) ||
      (sessionData.access_token as string | undefined)

    if (!token) {
      console.error('Session response structure:', JSON.stringify(sessionData, null, 2))
      throw new Error('Failed to extract token from session response')
    }

    // Cache token
    cachedToken = token
    cachedExpiry = Date.now() + ((sessionData.expiresIn as number | undefined) || 3600) * 1000

    return cachedToken
  } catch (error) {
    throw new Error(
      `Failed to get test auth token: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}

export function clearAuthTokenCache(): void {
  cachedToken = null
  cachedExpiry = null
}
