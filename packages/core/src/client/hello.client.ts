import { helloContract, HelloResponseSchema, type HelloResponse } from '@vencura/types'
import { fetchWithTimeout } from '@vencura/lib'

export const createHelloClient = ({
  baseUrl,
  headers,
}: {
  baseUrl: string
  headers?: Record<string, string>
}) => {
  const hello = async (): Promise<HelloResponse> => {
    const response = await fetchWithTimeout({
      url: `${baseUrl}${helloContract.path}`,
      options: {
        method: helloContract.method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return HelloResponseSchema.parse(data)
  }

  return { hello }
}
