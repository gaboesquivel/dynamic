import { helloContract, HelloResponseSchema, type HelloResponse } from '@vencura/types'

export const createHelloClient = ({
  baseUrl,
  headers,
}: {
  baseUrl: string
  headers?: Record<string, string>
}) => {
  const hello = async (): Promise<HelloResponse> => {
    const response = await fetch(`${baseUrl}${helloContract.path}`, {
      method: helloContract.method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
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
